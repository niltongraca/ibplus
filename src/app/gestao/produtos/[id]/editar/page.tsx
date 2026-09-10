"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import { apiFetch } from "@/lib/api";

interface ProductData {
  name: string;
  description: string | null;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  categoryId: string | null;
}

export default function EditarProdutoPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const [data, setData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ product: ProductData }>(`/api/products/${id}`)
      .then((d) => setData(d.product))
      .catch(() => router.push("/gestao/produtos"))
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
      type="product"
      id={id}
      initialData={{
        name: data.name,
        description: data.description,
        price: data.price,
        cost: data.cost,
        stock: data.stock,
        minStock: data.minStock,
        unit: data.unit,
        categoryId: data.categoryId,
      }}
    />
  );
}
