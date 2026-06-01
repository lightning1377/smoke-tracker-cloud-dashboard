import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, Target, TrendingUp, Wallet, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { money, relativeTime, shortTime } from "../lib/format";
import { queryKeys } from "../lib/queryKeys";

const getLocalDateTimeString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

export function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [timestamp, setTimestamp] = useState(getLocalDateTimeString());
  const [notes, setNotes] = useState("");

  const summary = useQuery({ queryKey: queryKeys.summary, queryFn: () => api.summary() });
  const trends = useQuery({ queryKey: queryKeys.trends, queryFn: () => api.trends("7d") });
  const items = useQuery({ queryKey: queryKeys.items, queryFn: api.items });
  const logs = useQuery({ queryKey: queryKeys.logs, queryFn: () => api.logs("?limit=5") });
  const progress = useQuery({ queryKey: queryKeys.targetProgress, queryFn: api.targetProgress });

  const addLogMutation = useMutation({
    mutationFn: async (data: { smokeItemId: string; timestamp: string; notes?: string }) => {
      return api.createLog(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setIsAddModalOpen(false);
      setNotes("");
      setTimestamp(getLocalDateTimeString());
    },
  });

  const openModal = () => {
    if (items.data?.items && items.data.items.length > 0) {
      setSelectedItemId(items.data.items[0].id);
    } else {
      setSelectedItemId("");
    }
    setTimestamp(getLocalDateTimeString());
    setIsAddModalOpen(true);
  };

  const lastLog = logs.data?.logs[0];

  return (
    <section className="page">
      <div className="metric-strip">
        <article className="metric-card">
          <span className="metric-icon green">
            <Wallet />
          </span>
          <strong>{money(summary.data?.totalCost ?? 0)}</strong>
          <span>Todays Cost</span>
        </article>
        <article className="metric-card">
          <span className="metric-icon blue">
            <Clock />
          </span>
          <strong>{summary.data?.smokeCount ?? 0}</strong>
          <span>Todays Count</span>
        </article>
        <article className="metric-card">
          <span className="metric-icon purple">
            <TrendingUp />
          </span>
          <strong>{summary.data?.averagePerDay ?? 0}</strong>
          <span>Average Daily</span>
        </article>
      </div>

      <article className="panel goal-preview" onClick={() => navigate("/targets")} style={{ cursor: "pointer" }}>
        <div className="panel-title-row">
          <h2>Goals</h2>
          <span className="chevron">›</span>
        </div>
        {progress.data?.progress && progress.data.progress.length > 0 ? (
          progress.data.progress.slice(0, 3).map((goal) => (
            <div className="goal-row" key={goal.itemId}>
              <span className="item-badge target-badge">
                <Target />
              </span>
              <div>
                <strong>{goal.itemName}</strong>
                <div className="progress-track">
                  <span style={{ width: `${goal.percentage}%` }} />
                </div>
              </div>
              <strong className="goal-count">
                {goal.current}/{goal.target}
              </strong>
            </div>
          ))
        ) : (
          <p className="muted">Create a daily target to track progress here.</p>
        )}
      </article>

      <article className="panel last-smoke">
        <span className="metric-icon violet">
          <Clock />
        </span>
        <div>
          <span className="muted">Time since last smoke</span>
          <strong>{lastLog ? relativeTime(lastLog.timestamp).replace(" ago", "") : "-"}</strong>
          <span>{lastLog?.item.name ?? "No logs yet"}</span>
        </div>
        <span className="muted">{lastLog ? shortTime(lastLog.timestamp) : ""}</span>
      </article>

      <article className="panel chart-panel">
        <h2>7-day trend</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trends.data?.points ?? []} margin={{ left: 0, right: 8, top: 16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" stroke="#dfe8f6" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#dbeafe" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </article>

      <button className="floating-action" type="button" onClick={openModal} id="open-add-log-fab-btn">
        <Plus aria-hidden="true" />
      </button>

      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Smoke Log</h2>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)} aria-label="Close modal">
                <X aria-hidden="true" />
              </button>
            </div>
            <form
              className="modal-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!selectedItemId) return;
                addLogMutation.mutate({
                  smokeItemId: selectedItemId,
                  timestamp: new Date(timestamp).toISOString(),
                  notes: notes || undefined,
                });
              }}
            >
              <label htmlFor="dashboard-item-select">
                Item
                <select
                  id="dashboard-item-select"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  required
                >
                  <option value="">Select item</option>
                  {items.data?.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {items.data?.items && items.data.items.length === 0 && (
                  <p style={{ marginTop: "8px", fontSize: "0.85rem", color: "#ef4444" }}>
                    No smoke items found. Please create one on the{" "}
                    <Link to="/items" style={{ textDecoration: "underline", color: "inherit" }}>
                      Items page
                    </Link>{" "}
                    first.
                  </p>
                )}
              </label>
              <label htmlFor="dashboard-time-input">
                Time
                <input
                  type="datetime-local"
                  id="dashboard-time-input"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  required
                />
              </label>
              <label htmlFor="dashboard-notes-input">
                Notes (Optional)
                <textarea
                  id="dashboard-notes-input"
                  placeholder="Any notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              <div className="modal-actions">
                <button className="button-link secondary" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" id="dashboard-submit-log-btn" disabled={addLogMutation.isPending}>
                  Add log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
