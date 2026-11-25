import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () =>
    api.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  getMe: () =>
    api.get('/auth/me'),
};

// Profile API
export const profileApi = {
  getProfile: () =>
    api.get('/profile'),

  updateProfile: (data: any) =>
    api.put('/profile', data),

  // Education
  addEducation: (data: any) =>
    api.post('/profile/education', data),

  updateEducation: (id: string, data: any) =>
    api.put(`/profile/education/${id}`, data),

  deleteEducation: (id: string) =>
    api.delete(`/profile/education/${id}`),

  // Experience
  addExperience: (data: any) =>
    api.post('/profile/experience', data),

  updateExperience: (id: string, data: any) =>
    api.put(`/profile/experience/${id}`, data),

  deleteExperience: (id: string) =>
    api.delete(`/profile/experience/${id}`),

  // Projects
  addProject: (data: any) =>
    api.post('/profile/projects', data),

  updateProject: (id: string, data: any) =>
    api.put(`/profile/projects/${id}`, data),

  deleteProject: (id: string) =>
    api.delete(`/profile/projects/${id}`),

  reorderProjects: (projectIds: string[]) =>
    api.post('/profile/projects/reorder', { projectIds }),

  // Certificates
  addCertificate: (data: any) =>
    api.post('/profile/certificates', data),

  updateCertificate: (id: string, data: any) =>
    api.put(`/profile/certificates/${id}`, data),

  deleteCertificate: (id: string) =>
    api.delete(`/profile/certificates/${id}`),

  // Skills
  addSkill: (data: any) =>
    api.post('/profile/skills', data),

  updateSkill: (id: string, data: any) =>
    api.put(`/profile/skills/${id}`, data),

  deleteSkill: (id: string) =>
    api.delete(`/profile/skills/${id}`),

  // API Keys
  saveApiKey: (data: { provider: string; apiKey: string; model?: string; isDefault?: boolean; baseUrl?: string }) =>
    api.post('/profile/api-keys', data),

  getApiKeys: () =>
    api.get('/profile/api-keys'),

  deleteApiKey: (provider: string) =>
    api.delete(`/profile/api-keys/${provider}`),
};

// Resume/LLM API
export const resumeApi = {
  getProviders: () =>
    api.get('/resume/providers'),

  validateKey: (provider: string, apiKey: string) =>
    api.post('/resume/validate-key', { provider, apiKey }),

  extractKeywords: (data: {
    jobDescription: string;
    llmConfig: {
      provider: string;
      model: string;
      promptType: 'system' | 'custom';
      apiKeySource: 'step1' | 'new' | 'system';
      apiKey?: string;
      customPrompt?: string;
      baseUrl?: string;
    };
  }) => api.post('/resume/keywords/extract', data),

  suggestProjects: (data: {
    jobDescription: string;
    keywords: any[];
    projectCount: number;
    projects: any[];
  }) => api.post('/resume/projects/suggest', data),

  generateResume: (data: {
    jobDescription: string;
    keywords: any[];
    profile: any;
    selectedProjects: string[];
    llmConfig: {
      provider: string;
      model: string;
      promptType: 'system' | 'custom';
      apiKeySource: 'step1' | 'new' | 'system';
      apiKey?: string;
      customPrompt?: string;
      baseUrl?: string;
    };
  }) => api.post('/resume/generate', data),

  regenerateSection: (data: {
    sectionName: string;
    context: any;
    currentContent: string;
    llmConfig: {
      provider: string;
      model: string;
      promptType: 'system' | 'custom';
      apiKeySource: 'step1' | 'new' | 'system';
      apiKey?: string;
      customPrompt?: string;
      baseUrl?: string;
    };
  }) => api.post('/resume/regenerate-section', data),

  getHistory: () =>
    api.get('/resume/history'),

  getById: (id: string) =>
    api.get(`/resume/${id}`),

  delete: (id: string) =>
    api.delete(`/resume/${id}`),

  updateKeywords: (id: string, data: { kept: any[]; discarded: any[] }) =>
    api.patch(`/resume/${id}/keywords`, data),
};

export default api;