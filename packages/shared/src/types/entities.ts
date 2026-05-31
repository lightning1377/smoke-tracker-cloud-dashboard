export type GoalType = "reduction" | "limit";
export type ExportStatus = "pending" | "processing" | "completed" | "failed";
export type ExportFormat = "csv" | "json";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmokeItem {
  id: string;
  userId: string;
  name: string;
  pricePerUnit: number;
  color: string;
  icon: string;
  dailyTarget?: number | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SmokeLog {
  id: string;
  userId: string;
  smokeItemId: string;
  timestamp: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SmokeLogWithItem extends SmokeLog {
  item: SmokeItem;
}

export interface Goal {
  id: string;
  userId: string;
  type: GoalType;
  smokeItemId: string;
  isActive: boolean;
  targetDate?: string | null;
  targetDailyAmount?: number | null;
  startingDailyLimit?: number | null;
  dailyLimit?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExportJob {
  id: string;
  userId: string;
  status: ExportStatus;
  format: ExportFormat;
  s3Key?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
}
