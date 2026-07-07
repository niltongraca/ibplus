"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UpgradePage() {
  const router = useRouter();
  useEffect(() => { router.replace("/gestao/dashboard"); }, [router]);
  return <div className="p-12 text-center text-gray-500">A redirecionar...</div>;
}
