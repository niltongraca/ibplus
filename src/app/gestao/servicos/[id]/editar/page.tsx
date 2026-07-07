"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductForm from "@/components/ProductForm";

export default function EditarServicoPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/services/${id}`)
      .then((r) => r.json())
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
