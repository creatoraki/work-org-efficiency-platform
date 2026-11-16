export interface JobDescSearchOptionsResponse {
	positionOptions?: Array<{
		positionId: number;
		positionName: string;
	}>;
	postGradeOptions?: Array<{
		postGrade: number;
		postGradeName: string;
	}>;
	updateByOptions?: Array<{
		userId: number;
		userName: string;
	}>;
}
