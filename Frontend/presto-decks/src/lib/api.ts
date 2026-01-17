/**
 * API client for SlideAI backend
 * Handles all communication with the generation API
 */

// ========== REQUEST TYPES ==========
export interface GenerateRequest {
  prompt: string;
  language?: string;
  tone?: string;
  length?: string;
  theme?: string;
  slideCount?: number;
  file?: File; // Optional document upload for RAG
  accessToken?: string; // Supabase auth token
}

export interface ExportRequest {
  projectId?: string;
  format: "pptx" | "pdf";
  deck: {
    title: string;
    subtitle?: string;
    theme?: string;
    colorScheme?: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
    slides: any[];
  };
  accessToken?: string; // Supabase auth token
}

// ========== RESPONSE TYPES ==========
export interface GenerateResponse {
  traceId: string;
}

export interface JobStatusResponse {
  status: "processing" | "succeeded" | "failed";
  type: "generate" | "export" | "regenerate-slide" | "modify-color-palette";
  deck?: DeckData;
  url?: string;
  error?: string;
  // For regenerate-slide jobs
  newSlide?: any;
  slideIndex?: number;
  // For modify-color-palette jobs
  newPalette?: any;
}

export interface DeckData {
  title: string;
  theme: string;
  slides: SlideData[];
}

export interface SlideData {
  type: string;
  title?: string;
  content?: any;
  layout?: string;
  [key: string]: any;
}

export interface ProjectResponse {
  id: string;
  title: string;
  theme: string;
  slides: SlideData[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListResponse {
  projects: ProjectResponse[];
}

// ========== API BASE URL ==========
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/v1";

// Helper to build headers with optional auth
const buildHeaders = (accessToken?: string, contentType?: string): HeadersInit => {
  const headers: HeadersInit = {};
  if (contentType) headers['Content-Type'] = contentType;
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  return headers;
};

// ========== API CLIENT ==========
export const api = {
  /**
   * 1️⃣ Generate a presentation from a prompt
   * POST /v1/generate
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      let response: Response;

      if (request.file) {
        // Use FormData for file upload (multipart/form-data)
        const formData = new FormData();
        formData.append('prompt', request.prompt);
        if (request.language) formData.append('language', request.language);
        if (request.tone) formData.append('tone', request.tone);
        if (request.length) formData.append('length', request.length);
        if (request.theme) formData.append('theme', request.theme);
        if (request.slideCount) formData.append('slideCount', String(request.slideCount));
        formData.append('file', request.file);

        response = await fetch(`${API_BASE_URL}/generate`, {
          method: 'POST',
          headers: request.accessToken ? { 'Authorization': `Bearer ${request.accessToken}` } : {},
          body: formData,
          // Note: Don't set Content-Type header - browser sets it with boundary
        });
      } else {
        // Use JSON for simple requests (backward compatible)
        response = await fetch(`${API_BASE_URL}/generate`, {
          method: 'POST',
          headers: buildHeaders(request.accessToken, 'application/json'),
          body: JSON.stringify({
            prompt: request.prompt,
            language: request.language,
            tone: request.tone,
            length: request.length,
            theme: request.theme,
            slideCount: request.slideCount,
          }),
        });
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'Une erreur est survenue lors de la génération',
        }));
        throw new Error(error.message || 'Erreur API');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error (generate):', error);
      throw error;
    }
  },

  /**
   * 2️⃣ Poll job status (for both generation and export)
   * GET /v1/jobs/:traceId
   */
  async getJobStatus(traceId: string): Promise<JobStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${traceId}`);

      if (!response.ok) {
        throw new Error("Impossible de récupérer le statut du job");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error (getJobStatus):", error);
      throw error;
    }
  },

  /**
   * 3️⃣ Export a presentation to PPTX or PDF
   * POST /v1/export
   */
  async exportPresentation(request: ExportRequest): Promise<GenerateResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Une erreur est survenue lors de l'export",
        }));
        throw new Error(error.message || "Erreur API");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error (export):", error);
      throw error;
    }
  },

  /**
   * 4️⃣ Get a single project by ID
   * GET /projects/:id
   */
  async getProject(id: string): Promise<ProjectResponse> {
    try {
      const response = await fetch(`${API_BASE_URL.replace("/v1", "")}/projects/${id}`);

      if (!response.ok) {
        throw new Error("Impossible de charger le projet");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error (getProject):", error);
      throw error;
    }
  },

  /**
   * 5️⃣ List all projects (for Dashboard)
   * GET /projects
   */
  async listProjects(): Promise<ProjectListResponse> {
    try {
      const response = await fetch(`${API_BASE_URL.replace("/v1", "")}/projects`);

      if (!response.ok) {
        throw new Error("Impossible de charger les projets");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error (listProjects):", error);
      throw error;
    }
  },

  /**
   * 6️⃣ Delete a project by ID
   * DELETE /projects/:id
   */
  async deleteProject(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL.replace("/v1", "")}/projects/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Impossible de supprimer le projet");
      }
    } catch (error) {
      console.error("API Error (deleteProject):", error);
      throw error;
    }
  },

  /**
   * 📎 Upload a file (document, image, etc.)
   * POST /v1/upload
   */
  async uploadFile(file: File): Promise<{ url: string }> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Upload Error:", error);
      throw error;
    }
  },

  /**
   * @deprecated Use getJobStatus instead
   */
  async getStatus(traceId: string): Promise<JobStatusResponse> {
    console.warn("api.getStatus is deprecated. Use api.getJobStatus instead.");
    return this.getJobStatus(traceId);
  },

  // ============================================
  // PRESENTATION SHARING API
  // ============================================

  /**
   * Get all presentations for the current user (owned + shared + viewOnly)
   * GET /v1/presentations
   */
  async getPresentations(accessToken: string): Promise<{ owned: any[]; shared: any[]; viewOnly: any[] }> {
    const response = await fetch(`${API_BASE_URL}/presentations`, {
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Impossible de charger les présentations');
    return response.json();
  },

  /**
   * Get a single presentation by ID
   * GET /v1/presentations/:id
   */
  async getPresentation(id: string, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/presentations/${id}`, {
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Présentation introuvable');
    return response.json();
  },

  /**
   * Save/update a presentation
   * PUT /v1/presentations/:id
   */
  async savePresentation(id: string, data: { slides?: any; title?: string }, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/presentations/${id}`, {
      method: 'PUT',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Échec de la sauvegarde');
    return response.json();
  },

  /**
   * Generate a share link for a presentation
   * POST /v1/presentations/:id/share
   * @param mode - 'edit' for collaborative access, 'view' for read-only access
   */
  async sharePresentation(id: string, accessToken: string, mode: 'edit' | 'view' = 'edit'): Promise<{ shareUrl: string; token: string; mode: 'edit' | 'view' }> {
    const response = await fetch(`${API_BASE_URL}/presentations/${id}/share`, {
      method: 'POST',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({ mode }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Erreur' }));
      throw new Error(err.message || 'Impossible de générer le lien de partage');
    }
    return response.json();
  },

  /**
   * Join a presentation using a share token
   * POST /v1/presentations/join
   */
  async joinPresentation(token: string, accessToken: string): Promise<{ presentationId: string }> {
    const response = await fetch(`${API_BASE_URL}/presentations/join`, {
      method: 'POST',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Lien invalide' }));
      throw new Error(err.message || 'Lien de partage invalide');
    }
    return response.json();
  },

  /**
   * Join a presentation using a view-only share token
   * POST /v1/presentations/join-view
   */
  async joinViewOnlyPresentation(token: string, accessToken: string): Promise<{ presentationId: string }> {
    const response = await fetch(`${API_BASE_URL}/presentations/join-view`, {
      method: 'POST',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Lien invalide' }));
      throw new Error(err.message || 'Lien de partage invalide');
    }
    return response.json();
  },

  /**
   * Add a new slide with AI
   * POST /v1/presentations/:id/slides/add
   */
  async addSlide(
    presentationId: string,
    options: { prompt: string },
    accessToken: string
  ): Promise<{ traceId: string }> {
    const response = await fetch(
      `${API_BASE_URL}/presentations/${presentationId}/slides/add`,
      {
        method: 'POST',
        headers: buildHeaders(accessToken, 'application/json'),
        body: JSON.stringify(options),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Erreur lors de la génération' }));
      throw new Error(err.message || 'Impossible de générer la slide');
    }
    return response.json();
  },

  /**
   * Regenerate a single slide with AI
   * POST /v1/presentations/:id/slides/:index/regenerate
   */
  async regenerateSlide(
    presentationId: string,
    slideIndex: number,
    options: { prompt?: string; mode?: 'visual' | 'detailed' | 'chart' },
    accessToken: string
  ): Promise<{ traceId: string }> {
    const response = await fetch(
      `${API_BASE_URL}/presentations/${presentationId}/slides/${slideIndex}/regenerate`,
      {
        method: 'POST',
        headers: buildHeaders(accessToken, 'application/json'),
        body: JSON.stringify(options),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Erreur' }));
      throw new Error(err.message || 'Impossible de régénérer la slide');
    }
    return response.json();
  },

  /**
   * Modify the color palette of a presentation with AI
   * POST /v1/presentations/:id/color-palette
   */
  async modifyColorPalette(
    presentationId: string,
    prompt: string,
    accessToken: string
  ): Promise<{ traceId: string }> {
    const response = await fetch(
      `${API_BASE_URL}/presentations/${presentationId}/color-palette`,
      {
        method: 'POST',
        headers: buildHeaders(accessToken, 'application/json'),
        body: JSON.stringify({ prompt }),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Erreur' }));
      throw new Error(err.message || 'Impossible de modifier la palette');
    }
    return response.json();
  },

  /**
   * Get the current user's subscription details
   * GET /v1/subscription
   */
  async getMySubscription(accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/subscription`, {
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Impossible de charger l\'abonnement');
    return response.json();
  },
};
