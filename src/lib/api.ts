export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  /** Código estruturado devolvido pelo servidor (ex: PLAN_LIMIT_REACHED). */
  get code(): string | undefined {
    const body = this.data as { code?: unknown } | null;
    return body && typeof body.code === "string" ? body.code : undefined;
  }
}

export const PLAN_LIMIT_EVENT = "ibplus:plan-limit";

export interface PlanLimitEventDetail {
  message: string;
  resource?: string;
}

/** Verdadeiro quando o erro veio de um limite de plano excedido. */
export function isPlanLimitError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.code === "PLAN_LIMIT_REACHED";
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const body = data as { error?: unknown; code?: unknown; resource?: unknown } | null;
    const errorMsg =
      body && typeof body.error === "string" && body.error ? body.error : `Erro (${res.status}).`;
    const error = new ApiError(res.status, errorMsg, data);

    // Aviso global: qualquer formulário que use apiFetch passa a oferecer o
    // atalho para /upgrade, sem repetir tratamento em cada componente.
    if (isPlanLimitError(error) && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent<PlanLimitEventDetail>(PLAN_LIMIT_EVENT, {
          detail: {
            message: errorMsg,
            ...(typeof body?.resource === "string" ? { resource: body.resource } : {}),
          },
        })
      );
    }

    throw error;
  }

  return data as T;
}
