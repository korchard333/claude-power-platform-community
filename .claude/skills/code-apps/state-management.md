# Code Apps — State Management

## Client State with Zustand

Use Zustand for cross-component client state (UI selections, filters, form drafts). TanStack Query handles server state; Zustand handles everything else.

```tsx
// src/hooks/useAppStore.ts
import { create } from "zustand";

interface AppState {
  selectedContactIds: Set<string>;
  sidebarOpen: boolean;
  filterStatus: "all" | "active" | "inactive";
  toggleContact: (id: string) => void;
  clearSelection: () => void;
  setSidebarOpen: (open: boolean) => void;
  setFilterStatus: (status: AppState["filterStatus"]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedContactIds: new Set(),
  sidebarOpen: true,
  filterStatus: "active",
  toggleContact: (id) =>
    set((state) => {
      const next = new Set(state.selectedContactIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { selectedContactIds: next };
    }),
  clearSelection: () => set({ selectedContactIds: new Set() }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setFilterStatus: (status) => set({ filterStatus: status }),
}));

// Usage in component:
function ContactList() {
  const { selectedContactIds, toggleContact } = useAppStore();
  // ...
}
```
