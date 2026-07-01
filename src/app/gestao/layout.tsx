import { AppLayout } from "@/components/layout/AppLayout";

export default function gestaoLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

