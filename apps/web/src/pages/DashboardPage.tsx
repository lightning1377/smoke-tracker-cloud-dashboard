import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalyticsSummary } from "@smoke-tracker/shared";
import { getJson } from "../lib/api";

const trendData = [
  { day: "Mon", count: 8 },
  { day: "Tue", count: 7 },
  { day: "Wed", count: 6 },
  { day: "Thu", count: 7 },
  { day: "Fri", count: 5 },
  { day: "Sat", count: 4 },
  { day: "Sun", count: 4 }
];

export function DashboardPage() {
  const summary = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => getJson<AnalyticsSummary>("/v1/analytics/summary")
  });

  return (
    <section>
      <div className="page-header">
        <div>
          <p className="eyebrow">Cloud companion</p>
          <h1>Dashboard</h1>
        </div>
      </div>

      <div className="metric-grid">
        <article className="metric">
          <span>Today's smoke count</span>
          <strong>{summary.data?.smokeCount ?? 0}</strong>
        </article>
        <article className="metric">
          <span>Today's cost</span>
          <strong>${summary.data?.totalCost.toFixed(2) ?? "0.00"}</strong>
        </article>
        <article className="metric">
          <span>Average per day</span>
          <strong>{summary.data?.averagePerDay ?? 0}</strong>
        </article>
        <article className="metric">
          <span>Most active hour</span>
          <strong>{summary.data?.mostActiveHour ?? "-"}</strong>
        </article>
      </div>

      <div className="panel">
        <h2>7-day trend</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trendData} margin={{ left: 8, right: 8, top: 16, bottom: 0 }}>
            <defs>
              <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#d8dee8" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#2563eb" fill="url(#countGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
