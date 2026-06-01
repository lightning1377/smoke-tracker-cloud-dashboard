import type {
  AnalyticsSummary,
  DailyTargetProgress,
  Goal,
  SmokeItem,
  SmokeLogWithItem,
  UserProfile,
} from "@smoke-tracker/shared";

export const apiBaseUrl = (() => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url === undefined || url === null) {
    return "http://localhost:4000";
  }
  if (url === "/" || url === "") {
    return "";
  }
  return url;
})();


export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String(body.message)
        : `API request failed with ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return body as T;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (response.status === 401 && retry && !path.startsWith("/v1/auth")) {
    const refresh = await fetch(`${apiBaseUrl}/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refresh.ok) {
      return apiRequest<T>(path, init, false);
    }
  }

  return parseResponse<T>(response);
}

export function postJson<T>(path: string, body: unknown) {
  return apiRequest<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchJson<T>(path: string, body: unknown) {
  return apiRequest<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteRequest(path: string) {
  return apiRequest<void>(path, { method: "DELETE" });
}

export const api = {
  health: () => apiRequest<{ status: string }>("/health"),
  me: () => apiRequest<{ user: UserProfile }>("/v1/me"),
  login: (body: { email: string; password: string }) => postJson<{ user: UserProfile }>("/v1/auth/login", body),
  register: (body: { email: string; password: string; displayName?: string; timezone?: string }) =>
    postJson<{ user: UserProfile }>("/v1/auth/register", body),
  logout: () => apiRequest<void>("/v1/auth/logout", { method: "POST" }),
  items: () => apiRequest<{ items: SmokeItem[] }>("/v1/smoke-items"),
  createItem: (body: Partial<SmokeItem>) => postJson<{ item: SmokeItem }>("/v1/smoke-items", body),
  updateItem: (id: string, body: Partial<SmokeItem>) => patchJson<{ item: SmokeItem }>(`/v1/smoke-items/${id}`, body),
  deleteItem: (id: string) => deleteRequest(`/v1/smoke-items/${id}`),
  logs: (query = "") =>
    apiRequest<{ logs: SmokeLogWithItem[]; pageInfo: { limit: number; nextCursor: string | null } }>(
      `/v1/smoke-logs${query}`,
    ),
  createLog: (body: { smokeItemId: string; timestamp: string; notes?: string | null }) =>
    postJson<{ log: SmokeLogWithItem }>("/v1/smoke-logs", body),
  updateLog: (id: string, body: { smokeItemId?: string; timestamp?: string; notes?: string | null }) =>
    patchJson<{ log: SmokeLogWithItem }>(`/v1/smoke-logs/${id}`, body),
  deleteLog: (id: string) => deleteRequest(`/v1/smoke-logs/${id}`),
  goals: () => apiRequest<{ goals: Goal[] }>("/v1/goals"),
  activeGoals: () => apiRequest<{ goals: Goal[] }>("/v1/goals/active"),
  createGoal: (body: unknown) => postJson<{ goal: Goal }>("/v1/goals", body),
  updateGoal: (id: string, body: unknown) => patchJson<{ goal: Goal }>(`/v1/goals/${id}`, body),
  deleteGoal: (id: string) => deleteRequest(`/v1/goals/${id}`),
  summary: (query = "") => apiRequest<AnalyticsSummary>(`/v1/analytics/summary${query}`),
  targetProgress: () => apiRequest<{ progress: DailyTargetProgress[] }>("/v1/analytics/daily-target-progress"),
  trends: (range = "30d", itemId = "") =>
    apiRequest<{ range: string; points: { date: string; count: number; cost: number }[] }>(
      `/v1/analytics/trends?range=${range}${itemId ? `&itemId=${itemId}` : ""}`,
    ),
};

export function exportUrl(format: "csv" | "json") {
  return `${apiBaseUrl}/v1/exports/download?format=${format}`;
}
