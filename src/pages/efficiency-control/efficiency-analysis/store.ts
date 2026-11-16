import { create } from "zustand";

interface OrgAction {
	setOrg: (org: Partial<OrgState>) => void;
	resetOrg: () => void;
}
interface StructureAction {
	setStructure: (structure: number, structureTitle: string) => void;
	resetStructure: () => void;
}

const initialState = {
	org_name: "",
	org_code: 1,
	parent_org_code: 0,
	org_tag: "TOP",
};
const initialStructureState = {
	structure: 1,
	structureTitle: "总人力成本",
};
interface OrgState {
	org_name: string;
	org_code: number;
	parent_org_code: number;
	org_tag: string;
}

interface StructureState {
	structure: number;
	structureTitle: string;
}
export const useOrgStore = create<OrgState & OrgAction>()((set) => ({
	...initialState,

	setOrg: (org) => {
		return set((prev) => ({
			...prev,
			...org,
		}));
	},

	resetOrg: () => {
		return set({
			...initialState,
		});
	},
}));

// 人力成本结构
export const useStructure = create<StructureState & StructureAction>()((set) => ({
	...initialStructureState,

	setStructure: (structure, structureTitle) => {
		return set(() => ({
			structure,
			structureTitle,
		}));
	},

	resetStructure: () => {
		return set({
			...initialStructureState,
		});
	},
}));
