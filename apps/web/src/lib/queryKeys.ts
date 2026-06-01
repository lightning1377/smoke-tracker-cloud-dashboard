export const queryKeys = {
  health: ["health"] as const,
  me: ["me"] as const,
  items: ["items"] as const,
  logs: ["logs"] as const,
  goals: ["goals"] as const,
  activeGoals: ["goals", "active"] as const,
  summary: ["analytics", "summary"] as const,
  targetProgress: ["analytics", "target-progress"] as const,
  trends: ["analytics", "trends"] as const,
};
