import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Target, Trash2, TrendingDown, X } from "lucide-react";
import { api } from "../lib/api";
import { numberValue, formValue } from "../lib/forms";
import { money } from "../lib/format";
import { queryKeys } from "../lib/queryKeys";

export function GoalsPage() {
  const queryClient = useQueryClient();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const items = useQuery({ queryKey: queryKeys.items, queryFn: api.items });
  const goals = useQuery({ queryKey: queryKeys.goals, queryFn: api.goals });
  const progress = useQuery({ queryKey: queryKeys.targetProgress, queryFn: api.targetProgress });
  const createGoal = useMutation({
    mutationFn: api.createGoal,
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
  const deleteGoal = useMutation({
    mutationFn: api.deleteGoal,
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
  const itemById = new Map(items.data?.items.map((item) => [item.id, item]));

  const filteredGoals = selectedItemId
    ? goals.data?.goals.filter((goal) => goal.smokeItemId === selectedItemId)
    : goals.data?.goals;

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <h1>Daily Targets</h1>
          <p>Limit goals and daily progress</p>
        </div>
        <button type="button" onClick={() => setIsAddModalOpen(true)} id="open-add-goal-modal-btn">
          <Plus aria-hidden="true" />
          Add goal
        </button>
      </div>

      <div className="chip-row">
        <span
          className={`item-chip ${selectedItemId === null ? "active" : ""}`}
          onClick={() => setSelectedItemId(null)}
          role="button"
          tabIndex={0}
          id="goals-chip-all"
        >
          <span /> All
        </span>
        {items.data?.items.map((item) => (
          <span
            className={`item-chip ${selectedItemId === item.id ? "active" : ""}`}
            key={item.id}
            style={{ borderColor: item.color }}
            onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
            role="button"
            tabIndex={0}
            id={`goals-chip-${item.id}`}
          >
            <span style={{ backgroundColor: item.color }} />
            {item.name}
            <strong>{progress.data?.progress.find((row) => row.itemId === item.id)?.current ?? 0}</strong>
          </span>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Daily Target</h2>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)} aria-label="Close modal">
                <X aria-hidden="true" />
              </button>
            </div>
            <form
              className="modal-form"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                createGoal.mutate({
                  type: "limit",
                  smokeItemId: formValue(form, "smokeItemId"),
                  dailyLimit: numberValue(form, "dailyLimit"),
                  isActive: true,
                });
                setIsAddModalOpen(false);
              }}
            >
              <label htmlFor="goal-item-select">
                Item
                <select name="smokeItemId" id="goal-item-select" required>
                  <option value="">Select item</option>
                  {items.data?.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor="goal-limit-input">
                Daily Limit
                <input
                  name="dailyLimit"
                  id="goal-limit-input"
                  placeholder="Daily limit"
                  type="number"
                  min="1"
                  required
                />
              </label>
              <div className="modal-actions">
                <button className="button-link secondary" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" id="submit-goal-btn">
                  Add goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="target-grid">
        {!filteredGoals || filteredGoals.length === 0 ? (
          <p className="panel muted">
            No goals found for this selection. Create a daily limit to start tracking progress.
          </p>
        ) : null}
        {filteredGoals?.map((goal) => {
          const item = itemById.get(goal.smokeItemId);
          const row = progress.data?.progress.find((entry) => entry.itemId === goal.smokeItemId);

          return (
            <article className="panel target-card" key={goal.id}>
              <div className="panel-title-row">
                <div className="target-heading">
                  <span className="metric-icon blue">
                    <Target />
                  </span>
                  <div>
                    <strong>{goal.type === "limit" ? "Limit Goal" : "Reduction Goal"}</strong>
                    <span>{goal.isActive ? "Active" : "Inactive"}</span>
                  </div>
                </div>
                <div className="row-actions">
                  <button className="ghost-icon" type="button" aria-label="Edit goal">
                    <Edit3 />
                  </button>
                  <button
                    className="ghost-icon danger"
                    type="button"
                    aria-label="Delete goal"
                    onClick={() => deleteGoal.mutate(goal.id)}
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>

              <div className="limit-box">
                <span>DAILY LIMIT</span>
                <strong>{goal.dailyLimit ?? goal.targetDailyAmount} per day</strong>
                <Target />
              </div>

              <div className="goal-progress-layout">
                <span className="item-avatar" style={{ backgroundColor: item?.color ?? "#3b82f6" }}>
                  {item?.icon ?? "?"}
                </span>
                <div>
                  <strong>{item?.name ?? "Unknown item"}</strong>
                  <span className="status-pill">
                    <TrendingDown /> {row?.status ?? "on-track"}
                  </span>
                </div>
                <div className="goal-numbers">
                  <strong>
                    {row?.current ?? 0}/{row?.target ?? goal.dailyLimit ?? 0}
                  </strong>
                  <span>{row?.remaining ?? 0} remaining</span>
                  <span>{money(row?.cost ?? 0)}</span>
                </div>
              </div>

              <div className="progress-track large">
                <span style={{ width: `${row?.percentage ?? 0}%` }} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
