import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, List, Plus, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { money, relativeTime, shortTime } from "../lib/format";
import { queryKeys } from "../lib/queryKeys";

const getLocalDateTimeString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

export function LogsPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [timestamp, setTimestamp] = useState(getLocalDateTimeString());
  const [notes, setNotes] = useState("");

  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const formatDateQuery = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  let fromQuery = "";
  let toQuery = "";

  if (viewMode === "daily") {
    fromQuery = formatDateQuery(currentDate);
    toQuery = formatDateQuery(currentDate);
  } else {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    fromQuery = formatDateQuery(firstDay);
    toQuery = formatDateQuery(lastDay);
  }

  const items = useQuery({ queryKey: queryKeys.items, queryFn: api.items });
  const logs = useQuery({
    queryKey: [...queryKeys.logs, viewMode, fromQuery, toQuery],
    queryFn: () => api.logs(`?from=${fromQuery}&to=${toQuery}&limit=100`),
  });
  const createLog = useMutation({
    mutationFn: api.createLog,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
  const deleteLog = useMutation({
    mutationFn: api.deleteLog,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
  const total = logs.data?.logs.reduce((sum, log) => sum + log.item.pricePerUnit, 0) ?? 0;

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };

  const getLeftLabel = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (viewMode === "daily") {
      const prevDate = new Date(currentDate.getTime() - 86400000);
      if (isSameDay(prevDate, today)) return "Today";
      const yesterday = new Date(today.getTime() - 86400000);
      if (isSameDay(prevDate, yesterday)) return "Yesterday";
      return prevDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      return prevMonth.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    }
  };

  const getMiddleLabel = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (viewMode === "daily") {
      if (isSameDay(currentDate, today)) return "Today";
      const yesterday = new Date(today.getTime() - 86400000);
      if (isSameDay(currentDate, yesterday)) return "Yesterday";
      return currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
  };

  const getRightLabel = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (viewMode === "daily") {
      const nextDate = new Date(currentDate.getTime() + 86400000);
      if (isSameDay(nextDate, today)) return "Today";
      const tomorrow = new Date(today.getTime() + 86400000);
      if (isSameDay(nextDate, tomorrow)) return "Tomorrow";
      return nextDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      return nextMonth.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    }
  };

  const handlePrev = () => {
    if (viewMode === "daily") {
      setCurrentDate(new Date(currentDate.getTime() - 86400000));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "daily") {
      setCurrentDate(new Date(currentDate.getTime() + 86400000));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <h1>Logs</h1>
          <p>
            {logs.data?.logs.length ?? 0} entries · <strong className="muted">Total: {money(total)}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (items.data?.items && items.data.items.length > 0) {
              setSelectedItemId(items.data.items[0].id);
            } else {
              setSelectedItemId("");
            }
            setTimestamp(getLocalDateTimeString());
            setIsAddModalOpen(true);
          }}
          id="open-add-log-modal-btn"
        >
          <Plus aria-hidden="true" />
          Add log
        </button>
      </div>

      <article className="panel segmented-panel">
        <div className="segmented-control">
          <button
            className={viewMode === "daily" ? "active" : ""}
            type="button"
            onClick={() => setViewMode("daily")}
            id="logs-view-daily-btn"
          >
            <List aria-hidden="true" />
            Daily
          </button>
          <button
            className={viewMode === "monthly" ? "active" : ""}
            type="button"
            onClick={() => setViewMode("monthly")}
            id="logs-view-monthly-btn"
          >
            <CalendarDays aria-hidden="true" />
            Monthly
          </button>
        </div>
        <div className="date-strip">
          <button type="button" className="date-strip-btn" onClick={handlePrev} id="logs-nav-prev">
            {getLeftLabel()}
          </button>
          <strong id="logs-nav-current">{getMiddleLabel()}</strong>
          <button type="button" className="date-strip-btn" onClick={handleNext} id="logs-nav-next">
            {getRightLabel()}
          </button>
        </div>
      </article>

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
                createLog.mutate(
                  {
                    smokeItemId: selectedItemId,
                    timestamp: new Date(timestamp).toISOString(),
                    notes: notes || null,
                  },
                  {
                    onSuccess: () => {
                      setIsAddModalOpen(false);
                      setNotes("");
                    },
                  },
                );
              }}
            >
              <label htmlFor="log-item-select">
                Item
                <select
                  id="log-item-select"
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
              </label>
              <label htmlFor="log-time-input">
                Time
                <input
                  type="datetime-local"
                  id="log-time-input"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  required
                />
              </label>
              <label htmlFor="log-notes-input">
                Notes (Optional)
                <textarea
                  id="log-notes-input"
                  placeholder="Optional note"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              <div className="modal-actions">
                <button className="button-link secondary" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" id="submit-log-btn" disabled={createLog.isPending}>
                  Add log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="item-list panel">
        {logs.isLoading ? <p className="muted">Loading logs...</p> : null}
        {logs.isError ? <p className="error-text">Could not load logs.</p> : null}
        {logs.data?.logs.length === 0 ? <p className="muted">No logs yet. Use the add button to record one.</p> : null}
        {logs.data?.logs.map((log) => (
          <article className="list-row" key={log.id}>
            <span className="item-avatar" style={{ backgroundColor: log.item.color }}>
              {log.item.icon}
            </span>
            <div>
              <strong>{log.item.name}</strong>
              <span className="log-info-row">
                <Clock size={18} /> {shortTime(log.timestamp)} · {relativeTime(log.timestamp)}
              </span>
            </div>
            <button
              className="ghost-icon danger"
              type="button"
              aria-label="Delete log"
              onClick={() => deleteLog.mutate(log.id)}
            >
              <Trash2 />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
