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
}

export interface ExportRequest {
  projectId: string;
  format: "pptx" | "pdf";
}

// ========== RESPONSE TYPES ==========
export interface GenerateResponse {
  traceId: string;
}

export interface JobStatusResponse {
  status: "processing" | "succeeded" | "failed";
  type: "generate" | "export";
  deck?: DeckData;
  url?: string;
  error?: string;
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
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/v1";

// ========== API CLIENT ==========
export const api = {
  /**
   * 1️⃣ Generate a presentation from a prompt
   * POST /v1/generate
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Une erreur est survenue lors de la génération",
        }));
        throw new Error(error.message || "Erreur API");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error (generate):", error);
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
};
