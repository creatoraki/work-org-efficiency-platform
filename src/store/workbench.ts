import { create } from "zustand";

export interface PendingWorkbenchQuery {
	path: string;
	query: Record<string, string>;
}

interface WorkBenchState {
	pendingLinkQuery: PendingWorkbenchQuery | null;
	setPendingLinkQuery: (path: string, query: Record<string, string>) => void;
	clearPendingLinkQuery: () => void;
	getPendingLinkQuery: (path: string) => Record<string, string> | null;
	consumePendingLinkQuery: (path: string) => Record<string, string> | null;
}

export const useWorkBenchStore = create<WorkBenchState>((set, get) => ({
	pendingLinkQuery: null,
	setPendingLinkQuery: (path, query) => set({ pendingLinkQuery: { path, query } }),
	clearPendingLinkQuery: () => set({ pendingLinkQuery: null }),
	getPendingLinkQuery: (path) => {
		const pendingLinkQuery = get().pendingLinkQuery;
		if (!pendingLinkQuery || pendingLinkQuery.path !== path) {
			return null;
		}

		return pendingLinkQuery.query;
	},
	consumePendingLinkQuery: (path) => {
		const pendingLinkQuery = get().pendingLinkQuery;
		if (!pendingLinkQuery || pendingLinkQuery.path !== path) {
			return null;
		}

		set({ pendingLinkQuery: null });
		return pendingLinkQuery.query;
	},
}));
