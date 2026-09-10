"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import { apiFetch } from "@/lib/api";

interface ServiceData {
  name: string;
  description: string | null;
  price: number;
  duration: string | null;
}

export default function EditarServicoPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const [data, setData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ service: ServiceData }>(`/api/services/${id}`)
      .then((d) => setData(d.service))
      .catch(() => router.push("/gestao/servicos"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-ib-muted text-sm">A carregar...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <ProductForm
      mode="edit"
      type="service"
      id={id}
      initialData={{
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration,
      }}
    />
  );
}
