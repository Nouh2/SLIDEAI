export interface Project {
    id: string;
    title: string;
    prompt: string;
    slides: any[];
    theme: {
        fontScale?: number;
        [key: string]: any;
    };
    createdAt: string;
    usage: number;
    thumbnail?: string;
}

const STORAGE_KEY = "slideai-projects";

export const projectService = {
    getAll: (): Project[] => {
        try {
            const localData = localStorage.getItem(STORAGE_KEY);
            const localProjects: Project[] = localData ? JSON.parse(localData) : [];

            // Return only localStorage projects (no hardcoded examples)
            return localProjects;
        } catch (error) {
            console.error("Failed to load projects", error);
            return [];
        }
    },

    add: (project: Project) => {
        try {
            const localData = localStorage.getItem(STORAGE_KEY);
            const localProjects: Project[] = localData ? JSON.parse(localData) : [];

            const newProjects = [project, ...localProjects];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
        } catch (error) {
            console.error("Failed to save project", error);
        }
    },

    delete: (id: string) => {
        try {
            const localData = localStorage.getItem(STORAGE_KEY);
            if (!localData) return;

            const localProjects: Project[] = JSON.parse(localData);
            const newProjects = localProjects.filter(p => p.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
        } catch (error) {
            console.error("Failed to delete project", error);
        }
    }
};
