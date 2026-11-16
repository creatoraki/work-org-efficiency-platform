import type { DeploymentDetail } from "#src/api/org-brain/deployment";

export interface ProjectInfoDescriptionsProps {
	detail?: DeploymentDetail | null;
	isBenchmark?: boolean;
}

export interface BenchmarkDiffNumberProps {
	diff: number;
	unit: string;
	decimalPlaces?: number;
}

export interface BenchmarkDiffTextProps {
	/** 标杆对比值（文本型） */
	benchmarkVal: string;
}
