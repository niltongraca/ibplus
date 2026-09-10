export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const body = data as { error?: unknown } | null;
    const errorMsg =
      body && typeof body.error === "string" && body.error ? body.error : `Erro (${res.status}).`;
    throw new ApiError(res.status, errorMsg, data);
  }

  return data as T;
}