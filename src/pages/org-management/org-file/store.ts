import type { OrgState } from "#src/api/org-management/org-file";
import { create } from "zustand";

interface OrgAction {
	setOrg: (org: Partial<OrgState>) => void;
	resetOrg: () => void;
}

const initialState = {
	id: "",
	name: "",
	orgFullName: "",
	parentId: "",
	projOrgStatus: null,
	standLayer: "",
	weight: 0,
	layer: 0,
};

export const useOrgStore = create<OrgState & OrgAction>()((set) => ({
	...initialState,
	setOrg: (org) =>
		set((prev) => ({
			...prev,
			...org,
		})),
	resetOrg: () =>
		set({
			...initialState,
		}),
}));
