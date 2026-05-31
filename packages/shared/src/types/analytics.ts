export interface DailyStatsItem {
  itemId: string;
  itemName: string;
  count: number;
  cost: number;
  color: string;
  icon: string;
}

export interface DailyStats {
  date: string;
  totalCost: number;
  smokeCount: number;
  items: Record<string, DailyStatsItem>;
}

export interface HourlyProgress {
  hour: number;
  count: number;
  cumulativeCount: number;
}

export interface DailyTargetProgress {
  itemId: string;
  itemName: string;
  target: number;
  current: number;
  remaining: number;
  percentage: number;
  status: "on-track" | "behind" | "over" | "complete";
  hourlyProgress: HourlyProgress[];
  cost: number;
  lastLogTime: string | null;
}

export interface AnalyticsSummary {
  from: string;
  to: string;
  smokeCount: number;
  totalCost: number;
  averagePerDay: number;
  mostActiveHour: number | null;
}
