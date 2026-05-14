import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Branch } from '@/types/branch.types';

interface BranchState {
  branches: Branch[];
  activeBranchId: string | null;
  setBranches: (branches: Branch[]) => void;
  setActiveBranch: (branchId: string) => void;
  getActiveBranch: () => Branch | undefined;
  reset: () => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      branches: [],
      activeBranchId: null,

      setBranches: (branches) => {
        set({ branches });

        const { activeBranchId } = get();
        if (branches.length === 0) return;

        // If activeBranchId is missing OR invalid, auto-select a valid one (main branch preferred)
        const activeStillValid = !!activeBranchId && branches.some((b) => b.id === activeBranchId);
        if (!activeStillValid) {
          const mainBranch = branches.find((b) => b.isMain) || branches[0];
          set({ activeBranchId: mainBranch.id });
          localStorage.setItem('activeBranchId', mainBranch.id);
        }
      },

      setActiveBranch: (branchId) => {
        set({ activeBranchId: branchId });
        localStorage.setItem('activeBranchId', branchId);
      },

      getActiveBranch: () => {
        const { branches, activeBranchId } = get();
        return branches.find((b) => b.id === activeBranchId);
      },

      reset: () => {
        set({ branches: [], activeBranchId: null });
        localStorage.removeItem('activeBranchId');
      },
    }),
    {
      name: 'retailflow-branch',
      partialize: (state) => ({
        activeBranchId: state.activeBranchId,
      }),
    }
  )
);
