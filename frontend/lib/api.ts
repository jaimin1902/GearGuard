const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authAPI = {
  signup: (data: { name: string; email: string; password: string; reEnterPassword: string }) =>
    fetchAPI("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  signin: (data: { email: string; password: string }) =>
    fetchAPI("/auth/signin", { method: "POST", body: JSON.stringify(data) }),
  forgotPassword: (email: string) =>
    fetchAPI("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  getCurrentUser: () => {
    const token = localStorage.getItem("token");
    return fetchAPI("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => fetchAPI("/dashboard/stats"),
  getTable: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return fetchAPI(`/dashboard/table${query}`);
  },
};

// Equipment API
export const equipmentAPI = {
  getAll: (params?: { department_id?: string; user_id?: string; team_id?: string; search?: string }) => {
    // Filter out undefined, null, and empty string values
    const filteredParams: any = {};
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null && value !== "" && value !== "undefined") {
          filteredParams[key] = value;
        }
      });
    }
    const query = new URLSearchParams(filteredParams).toString();
    return fetchAPI(`/equipment${query ? `?${query}` : ""}`);
  },
  getById: (id: number) => fetchAPI(`/equipment/${id}`),
  create: (data: any) => fetchAPI("/equipment", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI(`/equipment/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getRequests: (id: number) => fetchAPI(`/equipment/${id}/requests`),
  scrap: (id: number, reason: string) => fetchAPI(`/equipment/${id}/scrap`, { method: "POST", body: JSON.stringify({ reason }) }),
};

// Teams API
export const teamsAPI = {
  getAll: () => fetchAPI("/teams"),
  getById: (id: number) => fetchAPI(`/teams/${id}`),
  create: (data: any) => fetchAPI("/teams", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI(`/teams/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  addMember: (id: number, userId: number, isDefault: boolean) =>
    fetchAPI(`/teams/${id}/members`, { method: "POST", body: JSON.stringify({ user_id: userId, is_default: isDefault }) }),
  removeMember: (id: number, userId: number) => fetchAPI(`/teams/${id}/members/${userId}`, { method: "DELETE" }),
};

// Requests API
export const requestsAPI = {
  getAll: (params?: { status?: string; type?: string; team_id?: string; equipment_id?: string; assigned_to?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchAPI(`/requests${query ? `?${query}` : ""}`);
  },
  getById: (id: number) => fetchAPI(`/requests/${id}`),
  create: (data: any) => fetchAPI("/requests", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI(`/requests/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getCalendar: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    return fetchAPI(`/requests/calendar${params.toString() ? `?${params.toString()}` : ""}`);
  },
  getStatistics: (groupBy: "team" | "equipment_category") => fetchAPI(`/requests/statistics?group_by=${groupBy}`),
};

// Users API
export const usersAPI = {
  getAll: (params?: { role?: string; department_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchAPI(`/users${query ? `?${query}` : ""}`);
  },
  getTechnicians: () => fetchAPI("/users/technicians"),
};

// Departments API
export const departmentsAPI = {
  getAll: () => fetchAPI("/departments"),
  create: (data: any) => fetchAPI("/departments", { method: "POST", body: JSON.stringify(data) }),
};

// Work Centers API
export const workCentersAPI = {
  getAll: (params?: { search?: string; department_id?: string; team_id?: string }) => {
    // Filter out undefined, null, and empty string values
    const filteredParams: any = {};
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null && value !== "" && value !== "undefined") {
          filteredParams[key] = value;
        }
      });
    }
    const query = new URLSearchParams(filteredParams).toString();
    return fetchAPI(`/work-centers${query ? `?${query}` : ""}`);
  },
  getById: (id: number) => fetchAPI(`/work-centers/${id}`),
  create: (data: any) => fetchAPI("/work-centers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI(`/work-centers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => fetchAPI(`/work-centers/${id}`, { method: "DELETE" }),
};

// Equipment Categories API
export const equipmentCategoriesAPI = {
  getAll: () => fetchAPI("/equipment-categories"),
  getById: (id: number) => fetchAPI(`/equipment-categories/${id}`),
  create: (data: any) => fetchAPI("/equipment-categories", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI(`/equipment-categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => fetchAPI(`/equipment-categories/${id}`, { method: "DELETE" }),
};
