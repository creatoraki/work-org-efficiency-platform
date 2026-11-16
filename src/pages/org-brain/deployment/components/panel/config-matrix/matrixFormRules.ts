import type { DeployPositionMatrixRow } from "#src/api/org-brain/deployment";
import type { Rule } from "antd/es/form";

type MatrixRowFormValue = DeployPositionMatrixRow & {
	editMode?: "row" | "full";
	jobPositionTreeValue?: string;
};

/**
 * 根据行编辑类型生成岗位矩阵单元格校验规则。
 * 预填行（无 editMode）仅校验匹配模型与人数；可编辑行额外校验对应下拉字段。
 *
 * @param row - 当前矩阵行
 * @param field - 字段名
 * @returns antd Form rules
 */
export function getMatrixCellRules(
	row: MatrixRowFormValue | undefined,
	field: keyof DeployPositionMatrixRow | "jobPositionTreeValue",
): Rule[] {
	if (!row) {
		return [];
	}

	if (field === "tagMatchModelId") {
		return [{ required: true, message: "请选择匹配模型" }];
	}

	if (field === "requiredCount") {
		return [
			{
				required: true,
				message: "请输入人数",
			},
			{
				type: "number",
				min: 1,
				message: "人数须大于 0",
			},
		];
	}

	if (row.editMode === "full" && field === "departmentLine") {
		return [{ required: true, message: "请选择条线" }];
	}

	if (field === "jobPositionTreeValue") {
		return [{ required: true, message: "请选择岗位-职位-职级" }];
	}

	if (row.editMode && field === "authorizedJobId") {
		const messageMap: Partial<Record<keyof DeployPositionMatrixRow, string>> = {
			authorizedJobId: "请选择编制岗位",
		};
		return [{ required: true, message: messageMap[field] ?? "请完善该字段" }];
	}

	return [];
}
