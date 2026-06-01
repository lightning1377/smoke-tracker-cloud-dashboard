import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Trash2, X } from "lucide-react";
import type { SmokeItem } from "@smoke-tracker/shared";
import { api } from "../lib/api";
import { formValue, numberValue } from "../lib/forms";
import { money } from "../lib/format";
import { queryKeys } from "../lib/queryKeys";

const itemColors = ["#F43F46", "#3B82F6", "#22C55E", "#A855F7", "#F59E0B"];

export function ItemsPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const items = useQuery({ queryKey: queryKeys.items, queryFn: api.items });
  const createItem = useMutation({
    mutationFn: api.createItem,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.items });
      const previous = queryClient.getQueryData<{ items: SmokeItem[] }>(queryKeys.items);
      queryClient.setQueryData<{ items: SmokeItem[] }>(queryKeys.items, {
        items: [
          ...(previous?.items ?? []),
          {
            id: `optimistic-${Date.now()}`,
            userId: "optimistic",
            name: String(input.name),
            pricePerUnit: Number(input.pricePerUnit),
            color: String(input.color),
            icon: String(input.icon),
            dailyTarget: input.dailyTarget ? Number(input.dailyTarget) : null,
            isArchived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });
      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(queryKeys.items, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items });
    },
  });
  const updateItem = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<SmokeItem> }) => api.updateItem(id, body),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items });
    },
  });
  const deleteItem = useMutation({
    mutationFn: api.deleteItem,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items });
    },
  });

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <h1>Items</h1>
          <p>{items.data?.items.length ?? 0} entries</p>
        </div>
        <button type="button" onClick={() => setIsAddModalOpen(true)} id="open-add-item-modal-btn">
          <Plus aria-hidden="true" />
          Add item
        </button>
      </div>

      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Smoke Item</h2>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)} aria-label="Close modal">
                <X aria-hidden="true" />
              </button>
            </div>
            <form
              className="modal-form"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                createItem.mutate(
                  {
                    name: formValue(form, "name"),
                    pricePerUnit: numberValue(form, "pricePerUnit"),
                    color: formValue(form, "color"),
                    icon: formValue(form, "icon") || formValue(form, "name").slice(0, 1).toUpperCase(),
                    dailyTarget: numberValue(form, "dailyTarget") || null,
                  },
                  {
                    onSuccess: () => {
                      setIsAddModalOpen(false);
                    },
                  },
                );
              }}
            >
              <label htmlFor="item-name-input">
                Item Name
                <input id="item-name-input" name="name" placeholder="e.g. Cigarette, Vape" required />
              </label>
              <label htmlFor="item-icon-input">
                Icon Text (e.g. emoji or 1-2 letters)
                <input id="item-icon-input" name="icon" placeholder="🚬" maxLength={2} />
              </label>
              <label htmlFor="item-price-input">
                Price per Unit ($)
                <input
                  id="item-price-input"
                  name="pricePerUnit"
                  placeholder="e.g. 0.50"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                />
              </label>
              <label htmlFor="item-target-input">
                Daily Target (Optional)
                <input id="item-target-input" name="dailyTarget" placeholder="e.g. 15" type="number" min="1" />
              </label>
              <label htmlFor="item-color-select">
                Theme Color
                <select id="item-color-select" name="color" defaultValue={itemColors[0]}>
                  {itemColors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </label>
              <div className="modal-actions">
                <button className="button-link secondary" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" id="submit-item-btn" disabled={createItem.isPending}>
                  Add item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="item-list panel">
        {items.isLoading ? <p className="muted">Loading items...</p> : null}
        {items.isError ? <p className="error-text">Could not load items.</p> : null}
        {items.data?.items.length === 0 ? (
          <p className="muted">No smoke items yet. Add Cigarette, Vape, or anything else you track.</p>
        ) : null}
        {items.data?.items.map((item) => (
          <article className="list-row" key={item.id}>
            <span className="item-avatar" style={{ backgroundColor: item.color }}>
              {item.icon}
            </span>
            <div>
              <strong>{item.name}</strong>
              <span>{money(item.pricePerUnit)} per unit</span>
            </div>
            <div className="row-actions">
              <button
                className="ghost-icon"
                type="button"
                aria-label={`Increase ${item.name} target`}
                onClick={() => updateItem.mutate({ id: item.id, body: { dailyTarget: (item.dailyTarget ?? 0) + 1 } })}
              >
                <Edit3 />
              </button>
              <button
                className="ghost-icon danger"
                type="button"
                aria-label={`Archive ${item.name}`}
                onClick={() => deleteItem.mutate(item.id)}
              >
                <Trash2 />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
