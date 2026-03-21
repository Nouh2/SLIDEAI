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
  // Smart Report Parsing fields
  parseToken?: string; // Token from parseDocument response
  sectionIds?: string[]; // Which sections to include
  sectionVisuals?: Record<string, 'image' | 'chart-bar' | 'chart-pie' | 'chart-line' | 'text-only'>;
  // Brand kit fields
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  brandFonts?: {
    heading: string;
    body: string;
  };
  brandLogoUrl?: string;
  templateOverlay?: TemplateOverlay;
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
  type: "generate" | "export" | "regenerate-slide" | "modify-color-palette" | "translate-deck" | "analyze-image";
  deck?: DeckData;
  url?: string;
  error?: string;
  // For analyze-image jobs
  result?: any;
  // For regenerate-slide jobs
  newSlide?: any;
  slideIndex?: number;
  // For modify-color-palette jobs
  newPalette?: any;
  // For translate-deck jobs with duplication
  newPresentationId?: string;
}

// ========== SMART REPORT PARSING TYPES ==========
export interface DocumentSection {
  id: string;
  title: string;
  level: number;
  pageStart: number;
  pageEnd: number;
  charCount: number;
  estimatedSlides: number;
}

export interface ParseDocumentResponse {
  success: boolean;
  error?: string;
  document?: {
    title: string;
    totalPages: number;
    totalChars: number;
    sections: DocumentSection[];
  };
  parseToken?: string;
}

// ========== BRAND KIT TYPES ==========
export interface TemplateOverlay {
  logo?: {
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    size: 'small' | 'medium' | 'large';
    showOnCover: boolean;
    showOnContent: boolean;
  };
  footer?: {
    text: string;
    showPageNumber: boolean;
  };
}

export interface BrandKit {
  id: string;
  user_id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logo_url?: string;
  template_overlay?: TemplateOverlay;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandKitInput {
  name: string;
  colors: BrandKit['colors'];
  fonts: BrandKit['fonts'];
  logo_url?: string;
  template_overlay?: TemplateOverlay;
  is_default?: boolean;
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

  // Inject Organization ID if selected
  const orgId = typeof localStorage !== 'undefined' ? localStorage.getItem('slideai-org-id') : null;
  if (orgId && orgId !== 'personal') {
    headers['x-org-id'] = orgId;
  }

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

        // Brand kit - Serialize objects to JSON strings for multipart
        if (request.brandColors) formData.append('brandColors', JSON.stringify(request.brandColors));
        if (request.brandFonts) formData.append('brandFonts', JSON.stringify(request.brandFonts));
        if (request.brandLogoUrl) formData.append('brandLogoUrl', request.brandLogoUrl);
        if (request.templateOverlay) formData.append('templateOverlay', JSON.stringify(request.templateOverlay));

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
            brandColors: request.brandColors,
            brandFonts: request.brandFonts,
            brandLogoUrl: request.brandLogoUrl,
            templateOverlay: request.templateOverlay,
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
   * 📄 Parse document structure (Smart Report Parsing)
   * POST /v1/parse-document
   */
  async parseDocument(file: File, accessToken: string): Promise<ParseDocumentResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/parse-document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erreur lors de l\'analyse' }));
        throw new Error(error.message || 'Erreur API');
      }

      return response.json();
    } catch (error) {
      console.error('API Error (parseDocument):', error);
      throw error;
    }
  },

  /**
   * 🎯 Generate presentation from parsed document with section selection
   * POST /v1/generate (with parseToken)
   */
  async generateFromSections(
    request: {
      prompt: string;
      parseToken: string;
      sectionIds?: string[];
      sectionVisuals?: Record<string, 'image' | 'chart-bar' | 'chart-pie' | 'chart-line' | 'text-only'>;
      language?: string;
      tone?: string;
      theme?: string;
      slideCount?: number;
      // Brand kit fields
      brandColors?: GenerateRequest['brandColors'];
      brandFonts?: GenerateRequest['brandFonts'];
      brandLogoUrl?: string;
      templateOverlay?: TemplateOverlay;
    },
    accessToken: string
  ): Promise<GenerateResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: buildHeaders(accessToken, 'application/json'),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erreur lors de la génération' }));
        throw new Error(error.message || 'Erreur API');
      }

      return response.json();
    } catch (error) {
      console.error('API Error (generateFromSections):', error);
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
  async uploadFile(file: File, accessToken: string): Promise<{ url: string }> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur lors de l'upload: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Upload Error:", error);
      throw error;
    }
  },

  /**
   * 🌈 Extract theme from PPTX
   * POST /v1/brand/extract-theme
   */
  async extractTheme(file: File, accessToken: string): Promise<{ colors: BrandKit['colors'], fonts: BrandKit['fonts'] }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/brand/extract-theme`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Erreur extraction' }));
        throw new Error(err.message || 'Impossible d\'extraire le thème');
      }

      return response.json();
    } catch (error) {
      console.error("Theme Extraction Error:", error);
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
  async savePresentation(id: string, data: { slides?: any; title?: string; status?: string; fontConfig?: any }, accessToken: string): Promise<any> {
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
    options: { prompt?: string; mode?: 'visual' | 'detailed' | 'chart'; tone?: string; command?: string },
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

  async saveHearAboutUs(source: string, accessToken: string): Promise<void> {
    await fetch(`${API_BASE_URL}/subscription/hear-about-us`, {
      method: 'POST',
      headers: buildHeaders(accessToken),
      body: JSON.stringify({ source }),
    });
  },

  async startTrial(accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/subscription/start-trial`, {
      method: 'POST',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Impossible de démarrer l\'essai' }));
      throw new Error(err.message || 'Impossible de démarrer l\'essai');
    }
    return response.json();
  },

  /**
   * Get a presentation by view-only token (NO AUTH REQUIRED)
   * GET /v1/public/view/:token
   */
  async getPublicPresentation(token: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/public/view/${token}`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Présentation introuvable' }));
      throw new Error(err.message || 'Présentation introuvable ou lien expiré');
    }
    return response.json();
  },

  // === SLIDE LIBRARY ===
  async saveSlideToLibrary(name: string, content: any, accessToken: string, category?: string, type?: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/library/slides`, {
      method: 'POST',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({ name, content, category, type }),
    });
    if (!response.ok) throw new Error('Échec de la sauvegarde dans la bibliothèque');
    return response.json();
  },

  async getLibrarySlides(accessToken: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/library/slides`, {
      method: 'GET',
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Échec de la récupération de la bibliothèque');
    return response.json();
  },

  async deleteLibrarySlide(id: string, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/library/slides/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Échec de la suppression de la bibliothèque');
    return response.json();
  },

  /**
   * 🌍 Translate an entire deck via AI
   * POST /v1/translate
   */
  async translateDeck(deck: any, targetLanguage: string, accessToken: string, duplicate: boolean = false): Promise<GenerateResponse> {
    const response = await fetch(`${API_BASE_URL}/translate`, {
      method: "POST",
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({ deck, targetLanguage, duplicate }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Une erreur est survenue lors de la traduction",
      }));
      throw new Error(error.message || "Erreur API");
    }

    return response.json();
  },

  /**
   * 🧠 Analyze an image using AI (e.g., for Smart Paste)
   * POST /v1/ai/analyze-image
   */
  async analyzeImage(imageUrl: string, context?: string, accessToken?: string): Promise<{ traceId: string }> {
    const response = await fetch(`${API_BASE_URL}/ai/analyze-image`, {
      method: 'POST',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({ imageUrl, context }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur lors de l\'analyse' }));
      throw new Error(error.message || 'Impossible d\'analyser l\'image');
    }

    return response.json();
  },

  // ============================================
  // COMMENT SYSTEM API
  // ============================================

  /**
   * Add a comment to a slide
   * POST /v1/comments
   */
  async createComment(presentationId: string, slideId: string, content: string, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({ presentationId, slideId, content }),
    });
    if (!response.ok) throw new Error('Impossible d\'ajouter le commentaire');
    return response.json();
  },

  /**
   * Get all comments for a presentation
   * GET /v1/comments/:presentationId
   */
  async getComments(presentationId: string, accessToken: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/comments/${presentationId}`, {
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Impossible de charger les commentaires');
    return response.json();
  },

  /**
   * Resolve/Unresolve a comment
   * PATCH /v1/comments/:id
   */
  async resolveComment(id: string, resolved: boolean, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/comments/${id}`, {
      method: 'PATCH',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({ resolved }),
    });
    if (!response.ok) throw new Error('Impossible de mettre à jour le commentaire');
    return response.json();
  },

  /**
   * Delete a comment
   * DELETE /v1/comments/:id
   */
  async deleteComment(id: string, accessToken: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/comments/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Impossible de supprimer le commentaire');
  },

  // ============================================
  // OPS CMS API
  // ============================================

  async getOpsMe(accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/ops/me`, {
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Acces ops refuse');
    return response.json();
  },

  async getOpsOverview(accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/ops/overview`, {
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Impossible de charger les KPIs ops');
    return response.json();
  },

  async getOpsTemplates(accessToken: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/ops/email-templates`, {
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Impossible de charger les templates email');
    return response.json();
  },

  async getOpsTemplate(slug: string, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/ops/email-templates/${slug}`, {
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Impossible de charger le template');
    return response.json();
  },

  async updateOpsTemplate(slug: string, draftJson: Record<string, any>, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/ops/email-templates/${slug}`, {
      method: 'PUT',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({ draftJson }),
    });
    if (!response.ok) throw new Error('Impossible de sauvegarder le draft');
    return response.json();
  },

  async publishOpsTemplate(slug: string, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/ops/email-templates/${slug}/publish`, {
      method: 'POST',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error('Impossible de publier le template');
    return response.json();
  },

  async previewOpsTemplate(slug: string, mode: 'draft' | 'live', accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/ops/email-templates/${slug}/preview`, {
      method: 'POST',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({ mode }),
    });
    if (!response.ok) throw new Error('Impossible de generer le preview');
    return response.json();
  },

  async sendOpsTemplateTest(slug: string, mode: 'draft' | 'live', to: string, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/ops/email-templates/${slug}/test-send`, {
      method: 'POST',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({ mode, to }),
    });
    if (!response.ok) throw new Error('Impossible d envoyer le mail de test');
    return response.json();
  },

  async getOpsFlows(accessToken: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/ops/email-flows`, {
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Impossible de charger les flows');
    return response.json();
  },

  async updateOpsFlow(slug: string, payload: Record<string, any>, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/ops/email-flows/${slug}`, {
      method: 'PUT',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Impossible de sauvegarder le flow');
    return response.json();
  },

  async publishOpsFlow(slug: string, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/ops/email-flows/${slug}/publish`, {
      method: 'POST',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error('Impossible de publier le flow');
    return response.json();
  },

  async getOpsLogs(accessToken: string, limit = 120): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/ops/email-logs?limit=${limit}`, {
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Impossible de charger les logs email');
    return response.json();
  },

  async getBroadcastUsers(segment: string, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/ops/broadcast/users?segment=${segment}`, {
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Impossible de charger les destinataires');
    return response.json();
  },

  async broadcastPreview(params: object, accessToken: string): Promise<{ subject: string; html: string }> {
    const response = await fetch(`${API_BASE_URL}/ops/broadcast/preview`, {
      method: 'POST',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Impossible de générer le preview');
    return response.json();
  },

  async broadcastSend(params: object, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/ops/broadcast/send`, {
      method: 'POST',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Erreur lors de l\'envoi broadcast');
    return response.json();
  },

  // ============================================
  // ORGANIZATION API
  // ============================================

  /**
   * Create a new organization
   * POST /v1/orgs
   */
  async createOrg(name: string, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/orgs`, {
      method: 'POST',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Impossible de créer l\'organisation');
    return response.json();
  },

  /**
   * Get all organizations for the current user
   * GET /v1/orgs
   */
  async getUserOrgs(accessToken: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/orgs`, {
      method: 'GET',
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Impossible de charger les organisations');
    return response.json();
  },

  /**
   * Get members of an organization
   * GET /v1/orgs/:id/members
   */
  async getOrgMembers(orgId: string, accessToken: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/orgs/${orgId}/members`, {
      method: 'GET',
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Impossible de charger les membres');
    return response.json();
  },

  /**
   * Add a member to an organization
   * POST /v1/orgs/:id/members
   */
  async addMember(orgId: string, email: string, role: 'admin' | 'member', accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/orgs/${orgId}/members`, {
      method: 'POST',
      headers: buildHeaders(accessToken, 'application/json'),
      body: JSON.stringify({ email, role }),
    });
    if (!response.ok) throw new Error('Impossible d\'ajouter le membre');
    return response.json();
  },

  /**
   * Remove a member from an organization
   * DELETE /v1/orgs/:id/members/:userId
   */
  async removeMember(orgId: string, userId: string, accessToken: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/orgs/${orgId}/members/${userId}`, {
      method: 'DELETE',
      headers: buildHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Impossible de retirer le membre');
  },
};
