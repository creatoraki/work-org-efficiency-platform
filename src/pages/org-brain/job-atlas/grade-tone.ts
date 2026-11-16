export const MATRIX_GRADE_TONE = {
	low_1_4: { bg: "#EDF8F2", text: "#17B26A" },
	mid_5_8: { bg: "#ECF5FF", text: "#1677FF" },
	high_9_E: { bg: "#FFF5EB", text: "#FF7D00" },
} as const;

const HIGH_GRADE_LETTERS = new Set(["E", "D", "C", "B", "A"]);

export function getMatrixCellToneByGradeTitle(title: string) {
	const gradeCode = title.trim().toUpperCase();
	const numericMatch = gradeCode.match(/\d+/);
	if (numericMatch) {
		const gradeNum = Number.parseInt(numericMatch[0], 10);
		if (Number.isFinite(gradeNum)) {
			if (gradeNum >= 1 && gradeNum <= 4) {
				return MATRIX_GRADE_TONE.low_1_4;
			}
			if (gradeNum >= 5 && gradeNum <= 8) {
				return MATRIX_GRADE_TONE.mid_5_8;
			}
			return MATRIX_GRADE_TONE.high_9_E;
		}
	}

	if (HIGH_GRADE_LETTERS.has(gradeCode)) {
		return MATRIX_GRADE_TONE.high_9_E;
	}

	return MATRIX_GRADE_TONE.high_9_E;
}
