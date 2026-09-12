"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type ListResponse = { totalPages?: number; total?: number; [key: string]: unknown };

interface UseListOptions<T> {
  limit?: number;
  extract?: (data: ListResponse) => T[];
  params?: Record<string, string | number | undefined>;
}

export function useList<T>(url: string, key: string, options: UseListOptions<T> = {}) {
  const { limit, extract, params } = options;
  const extractor = extract ?? ((d: ListResponse) => (d[key] as T[] | undefined) ?? []);

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [nonce, setNonce] = useState(0);

  const paramsKey = useMemo(() => {
    if (!params) return "";
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
      )
    );
  }, [params]);

  const [debouncedKey, setDebouncedKey] = useState(paramsKey);

  useEffect(() => {
    if (paramsKey === debouncedKey) return;
    const t = setTimeout(() => {
      setDebouncedKey(paramsKey);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [paramsKey, debouncedKey]);

  useEffect(() => {
    let cancelled = false;
    if (debouncedKey !== paramsKey) return undefined;
    setLoading(true);

    const sep = url.includes("?") ? "&" : "?";
    const paramObj = debouncedKey ? JSON.parse(debouncedKey) : null;
    const qp = new URLSearchParams();
    if (paramObj) for (const [k, v] of Object.entries(paramObj)) qp.set(k, String(v));
    if (limit) qp.set("limit", String(limit));
    qp.set("page", String(page));

    const fullUrl = `${url}${sep}${qp.toString()}`;

    apiFetch<ListResponse>(fullUrl)
      .then((d) => {
        if (cancelled) return;
        setData(extractor(d));
        if (limit) {
          setTotalPages(typeof d.totalPages === "number" && d.totalPages >= 1 ? d.totalPages : 1);
          setTotal(typeof d.total === "number" && d.total >= 0 ? d.total : 0);
        }
      })
      .catch((err) => console.error("Erro ao carregar dados:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, url, nonce, debouncedKey]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { data, setData, loading, page, setPage, totalPages, total, refetch, refresh: refetch };
}