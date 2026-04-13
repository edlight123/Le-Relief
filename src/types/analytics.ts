export interface AnalyticsEvent {
  id: string;
  type: string;
  articleId: string | null;
  data: string | null;
  createdAt: Date;
}

export interface StatCard {
  label: string;
  value: number | string;
  change?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}
