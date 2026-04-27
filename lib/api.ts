import { API_BASE_URL, API_ENDPOINTS, type ApiResponse, type PaginatedResponse, type PostsFilter } from '@/types';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: data });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body: data });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: data });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

// Auth API
export const authApi = {
  register: (data: any) => api.post<ApiResponse>(API_ENDPOINTS.auth.register, data),
  login: (data: any) => api.post<ApiResponse>(API_ENDPOINTS.auth.login, data),
  logout: () => api.post<ApiResponse>(API_ENDPOINTS.auth.logout),
  refresh: () => api.post<ApiResponse>(API_ENDPOINTS.auth.refresh),
  me: () => api.get<ApiResponse>(API_ENDPOINTS.auth.me),
  updateProfile: (data: any) => api.patch<ApiResponse>(API_ENDPOINTS.auth.profile, data),
  changePassword: (data: any) => api.patch<ApiResponse>(API_ENDPOINTS.auth.changePassword, data),
};

// Posts API
export const postsApi = {
  list: (params: PostsFilter = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    return api.get<PaginatedResponse<any>>(`${API_ENDPOINTS.posts.list}?${queryString}`);
  },
  featured: () => api.get<ApiResponse>(API_ENDPOINTS.posts.featured),
  getById: (id: string) => api.get<ApiResponse>(API_ENDPOINTS.posts.byId(id)),
  getBySlug: (slug: string) => api.get<ApiResponse>(API_ENDPOINTS.posts.bySlug(slug)),
  create: (data: any) => api.post<ApiResponse>(API_ENDPOINTS.posts.create, data),
  update: (id: string, data: any) => api.patch<ApiResponse>(API_ENDPOINTS.posts.update(id), data),
  delete: (id: string) => api.delete<ApiResponse>(API_ENDPOINTS.posts.delete(id)),
  getComments: (id: string) => api.get<ApiResponse>(API_ENDPOINTS.posts.comments(id)),
  getRelated: (id: string) => api.get<ApiResponse>(API_ENDPOINTS.posts.related(id)),
  like: (id: string) => api.post<ApiResponse>(API_ENDPOINTS.interactions.like(id)),
  bookmark: (id: string) => api.post<ApiResponse>(API_ENDPOINTS.interactions.bookmark(id)),
};

// Categories API
export const categoriesApi = {
  list: () => api.get<ApiResponse>('/categories'),
};

// Comments API
export const commentsApi = {
  create: (data: any) => api.post<ApiResponse>(API_ENDPOINTS.comments.create, data),
  update: (id: string, data: any) => api.patch<ApiResponse>(API_ENDPOINTS.comments.update(id), data),
  delete: (id: string) => api.delete<ApiResponse>(API_ENDPOINTS.comments.delete(id)),
};

// AI API
export const aiApi = {
  summarize: (data: any) => api.post<ApiResponse>(API_ENDPOINTS.ai.summarize, data),
  recommend: (data: any) => api.post<ApiResponse>(API_ENDPOINTS.ai.recommend, data),
  chat: (data: any) => api.post<ApiResponse>(API_ENDPOINTS.ai.chat, data),
  suggestTags: (data: any) => api.post<ApiResponse>(API_ENDPOINTS.ai.suggestTags, data),
  seoSuggestions: (data: any) => api.post<ApiResponse>(API_ENDPOINTS.ai.seoSuggestions, data),
};

// Admin API
export const adminApi = {
  users: () => api.get<ApiResponse>(API_ENDPOINTS.admin.users),
  updateUserRole: (id: string, data: any) => api.patch<ApiResponse>(API_ENDPOINTS.admin.userRole(id), data),
  analytics: () => api.get<ApiResponse>(API_ENDPOINTS.admin.analytics),
  pendingComments: () => api.get<ApiResponse>(API_ENDPOINTS.admin.pendingComments),
};
