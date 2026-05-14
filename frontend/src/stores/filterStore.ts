import { create } from 'zustand';

interface FilterState {
  category_id: string | null;
  is_completed: boolean | null;
  overdue: boolean | null;
  setFilter: (filter: Partial<Pick<FilterState, 'category_id' | 'is_completed' | 'overdue'>>) => void;
  resetFilter: () => void;
}

export const useFilterStore = create<FilterState>()((set) => ({
  category_id: null,
  is_completed: null,
  overdue: null,
  setFilter: (filter) => set((state) => ({ ...state, ...filter })),
  resetFilter: () => set({ category_id: null, is_completed: null, overdue: null }),
}));
