import { API_URL } from "./api";

export type ApiErrorBody = {
  code?: string;
  message?: string;
  details?: { field: string; message: string }[];
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: ApiErrorBody,
  ) {
    super(message);
  }
}

export type ApiMood = "kiritto" | "mattari";
export type ApiMoodFilter = ApiMood | "both";

export type ApiWeather = {
  code: number;
  label: string;
  icon:
    | "sunny"
    | "partly-cloudy"
    | "cloudy"
    | "fog"
    | "rain"
    | "snow"
    | "thunder";
  temperature: number;
};

export type ApiWeatherCurrent = {
  weather: ApiWeather & { humidity: number | null };
  updatedAt: string;
};

export type ApiWeatherForecast = {
  date: string;
  code: number;
  label: string;
  icon: ApiWeather["icon"];
  tempMax: number | null;
  tempMin: number | null;
  precipitationProbability: number;
};

export type ApiKeeper = {
  id: string;
  username: string;
};

export type ApiPostSummary = {
  id: string;
  title: string;
  imageUrl: string | null;
  tags: string[];
  mood: ApiMood;
  takenAt: string;
  likeCount: number;
  isLiked: boolean;
  keeper: ApiKeeper | null;
  createdAt: string;
};

export type ApiPostDetail = ApiPostSummary & {
  description: string;
  weather: ApiWeather | null;
  commentCount: number;
};

export type ApiComment = {
  id: string;
  content: string;
  name: string;
  createdAt: string;
};

export type ApiEvent = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  tags?: string[];
  startDate: string;
  endDate: string;
  keeper?: ApiKeeper;
  createAt?: string;
};

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  const text = await response.text();
  let body: T | ApiErrorBody | undefined;
  if (text) {
    try {
      body = JSON.parse(text) as T | ApiErrorBody;
    } catch {
      body = undefined;
    }
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | undefined;
    throw new ApiClientError(
      errorBody?.message ?? `API request failed: ${response.status}`,
      response.status,
      errorBody,
    );
  }

  return body as T;
}

export function getCurrentWeather() {
  return requestJson<ApiWeatherCurrent>("/weather/current");
}

export function getWeatherForecast(days = 7) {
  return requestJson<{ forecasts: ApiWeatherForecast[] }>(
    `/weather/forecast?days=${days}`,
  );
}

export function getEvents(yearMonth: string) {
  return requestJson<{ events: ApiEvent[] }>(
    `/events?yearMonth=${encodeURIComponent(yearMonth)}`,
  );
}

export function createEvent(input: {
  title: string;
  description?: string;
  location?: string;
  tags: string[];
  startDate: string;
  endDate: string;
}) {
  return requestJson<ApiEvent>("/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getPosts(options: {
  mood?: ApiMoodFilter;
  tags?: string;
  sort?: "latest" | "oldest" | "likes";
  page?: number;
  limit?: number;
} = {}) {
  const query = new URLSearchParams({
    mood: options.mood ?? "both",
    sort: options.sort ?? "latest",
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 50),
  });
  if (options.tags) query.set("tags", options.tags);
  return requestJson<{
    items: ApiPostSummary[];
    total: number;
    page: number;
    totalPages: number;
  }>(`/posts?${query}`);
}

export function getPost(id: string) {
  return requestJson<ApiPostDetail>(`/posts/${encodeURIComponent(id)}`);
}

export function createPost(input: {
  title: string;
  description?: string;
  tags: string[];
  weatherCode?: number;
  temperature?: number;
  takenAt: string;
  image: File;
  mood: ApiMood;
}) {
  const body = new FormData();
  body.set("title", input.title);
  body.set("description", input.description ?? "");
  body.set("tags", JSON.stringify(input.tags));
  body.set("takenAt", input.takenAt);
  body.set("mood", input.mood);
  body.set("image", input.image);
  if (input.weatherCode !== undefined) {
    body.set("weatherCode", String(input.weatherCode));
  }
  if (input.temperature !== undefined) {
    body.set("temperature", String(input.temperature));
  }
  return requestJson<ApiPostDetail>("/posts", {
    method: "POST",
    body,
  });
}

export function updatePost(
  id: string,
  input: Partial<{
    title: string;
    description: string;
    tags: string[];
    weatherCode: number;
    temperature: number;
    takenAt: string;
    mood: ApiMood;
  }>,
) {
  return requestJson<ApiPostDetail>(`/posts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...input,
      ...(input.tags ? { tags: JSON.stringify(input.tags) } : {}),
    }),
  });
}

export function deletePost(id: string) {
  return requestJson<void>(`/posts/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function likePost(id: string) {
  return requestJson<{ likeCount: number }>(
    `/posts/${encodeURIComponent(id)}/like`,
    { method: "POST" },
  );
}

export function getComments(id: string) {
  return requestJson<{
    items: ApiComment[];
    total: number;
    page: number;
    totalPages: number;
  }>(`/posts/${encodeURIComponent(id)}/comments`);
}

export function createComment(id: string, name: string, content: string) {
  return requestJson<ApiComment>(`/posts/${encodeURIComponent(id)}/comments`, {
    method: "POST",
    body: JSON.stringify({ name, content }),
  });
}
