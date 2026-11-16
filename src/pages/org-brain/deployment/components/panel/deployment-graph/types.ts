import type { DeployCandidateItem } from "#src/api/org-brain/candidate";
import type { DeploymentPlanStaffConfigItem } from "#src/api/org-brain/deployment";

export type DeploymentNodeKind = "root" | "line" | "leaf";

export interface DeploymentNodeData {
	kind: DeploymentNodeKind;
	name: string;
	departmentLine?: string;
	positionName?: string;
	positionLevel?: string;
	positionCode?: string;
	staffCount?: number;
	staffConfigList?: DeploymentPlanStaffConfigItem[];
	candidates?: DeployCandidateItem[];
	lineCount?: number;
	solutionNo?: number;
	rowIndex?: number;
	onLeafUpdate?: (payload: {
		solutionNo: number;
		rowIndex: number;
		staffConfigList?: DeploymentPlanStaffConfigItem[];
	}) => void;
	onOpenCandidateDrawer?: (nodeData: DeploymentNodeData) => void;
}
