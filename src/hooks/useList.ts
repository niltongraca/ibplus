"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type ListResponse = { totalPages?: number; total?: number; [key: string]: unknown };

interface UseListOptions<T> {
  limit?: number;
  extract?: (data: ListResponse) => T[];
}

export function useList<T>(url: string, key: string, options: UseListOptions<T> = {}) {
  const { limit, extract } = options;
  const extractor = extract ?? ((d: ListResponse) => (d[key] as T[] | undefined) ?? []);

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const sep = url.includes("?") ? "&" : "?";
    const fullUrl = limit ? `${url}${sep}page=${page}&limit=${limit}` : url;

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
  }, [page, limit, url, nonce, extract]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { data, setData, loading, page, setPage, totalPages, total, refetch };
}