import { AppLayout } from "@/components/layout/AppLayout";

export default function storeLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

