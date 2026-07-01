import { AppLayout } from "@/components/layout/AppLayout";

export default function RhLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
