import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, DollarSign, Target, TrendingUp } from "lucide-react";
import { api } from "../lib/api";
import { money } from "../lib/format";
import { queryKeys } from "../lib/queryKeys";

export function AnalyticsPage() {
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const summary = useQuery({
    queryKey: [...queryKeys.summary, range, selectedItemId],
    queryFn: () => api.summary(selectedItemId ? `?itemId=${selectedItemId}` : ""),
  });
  const trends = useQuery({
    queryKey: [...queryKeys.trends, range, selectedItemId],
    queryFn: () => api.trends(range, selectedItemId),
  });
  const items = useQuery({ queryKey: queryKeys.items, queryFn: api.items });

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <h1>Analytics</h1>
          <p>Spend, volume, and target trends</p>
        </div>
      </div>

      <article className="panel segmented-panel">
        <div className="segmented-control">
          <button className={range === "7d" ? "active" : ""} type="button" onClick={() => setRange("7d")}>
            Daily
          </button>
          <button className={range === "30d" ? "active" : ""} type="button" onClick={() => setRange("30d")}>
            Weekly
          </button>
        </div>
      </article>

      <div className="chip-row">
        <span
          className={`item-chip ${selectedItemId === "" ? "active" : ""}`}
          onClick={() => setSelectedItemId("")}
          role="button"
          tabIndex={0}
          id="analytics-chip-all"
        >
          <span /> All
        </span>
        {items.data?.items.map((item) => (
          <span
            className={`item-chip ${selectedItemId === item.id ? "active" : ""}`}
            key={item.id}
            onClick={() => setSelectedItemId(item.id)}
            role="button"
            tabIndex={0}
            id={`analytics-chip-${item.id}`}
          >
            <span style={{ backgroundColor: item.color }} /> {item.name}
          </span>
        ))}
      </div>

      <div className="analytics-grid">
        <article className="metric-card info-card">
          <span className="metric-icon green">
            <DollarSign />
          </span>
          <strong>{money(summary.data?.totalCost ?? 0)}</strong>
          <span>Daily Cost</span>
        </article>
        <article className="metric-card info-card">
          <span className="metric-icon blue">
            <CalendarDays />
          </span>
          <strong>{money((summary.data?.totalCost ?? 0) * 3)}</strong>
          <span>Weekly Cost</span>
        </article>
        <article className="metric-card info-card">
          <span className="metric-icon purple">
            <TrendingUp />
          </span>
          <strong>{summary.data?.smokeCount ?? 0}</strong>
          <span>Monthly</span>
        </article>
        <article className="metric-card info-card">
          <span className="metric-icon orange">
            <Target />
          </span>
          <strong>{summary.data?.averagePerDay ?? 0}</strong>
          <span>Average Daily</span>
        </article>
      </div>

      <article className="panel chart-panel">
        <h2>Trends - {range === "7d" ? "Daily" : "Weekly"}</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={trends.data?.points ?? []} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" stroke="#dfe8f6" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[12, 12, 0, 0]} fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </article>
    </section>
  );
}
