import { DASHBOARD_LAYOUT } from "./layoutRules";
import { DASHBOARD_WIDGETS, type WidgetId } from "./widgets";

export interface DashboardWidget {
  id: WidgetId;
  title: string;
  description: string;
}

export function getDashboard(accountType: string): DashboardWidget[] {
  const layout = DASHBOARD_LAYOUT[accountType];
  if (!layout) return [];

  return layout.map((id) => {
    const def = DASHBOARD_WIDGETS[id];
    return { id, title: def.title, description: def.description };
  });
}
