"use client";

import { useParams } from "next/navigation";
import DocumentForm from "@/components/finance/DocumentForm";

export default function EditarOrcamentoPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  return <DocumentForm mode="quote" id={id} />;
}