export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  status: "active" | "coming-soon";
}

export interface SidebarItem {
  label: string;
  href: string;
  icon: string;
  module: string;
}
