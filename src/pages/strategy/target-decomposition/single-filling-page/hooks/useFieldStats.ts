import type { FieldStats } from "../types";
import { useState } from "react";

/**
 * 字段统计信息管理 Hook（顶部六个方块）
 * 简化版 - 仅状态管理，不包含数据加载逻辑
 */
export function useFieldStats() {
	const [fieldObj, setFieldObj] = useState<string>("");
	const [fieldSubLeft, setFieldSubLeft] = useState<string>("");
	const [fieldIndicator, setFieldIndicator] = useState<string>("");
	const [fieldTarget, setFieldTarget] = useState<string>("");
	const [fieldGap, setFieldGap] = useState<string>("");
	const [fieldGapDesc, setFieldGapDesc] = useState<string>("");
	const [checkStatus, setCheckStatus] = useState<boolean>(false);
	const [boxHeight, setBoxHeight] = useState<number>(66);
	const [validateFailed, setValidateFailed] = useState(false);

	const updateFieldStats = (data: Partial<FieldStats>) => {
		if (data.obj !== undefined) setFieldObj(data.obj);
		if (data.subLeft !== undefined) setFieldSubLeft(data.subLeft);
		if (data.indicator !== undefined) setFieldIndicator(data.indicator);
		if (data.target !== undefined) setFieldTarget(data.target);
		if (data.gap !== undefined) setFieldGap(data.gap);
		if (data.gapDesc !== undefined) setFieldGapDesc(data.gapDesc);
	};

	return {
		fieldObj,
		setFieldObj,
		fieldSubLeft,
		setFieldSubLeft,
		fieldIndicator,
		setFieldIndicator,
		fieldTarget,
		setFieldTarget,
		fieldGap,
		setFieldGap,
		fieldGapDesc,
		setFieldGapDesc,
		checkStatus,
		setCheckStatus,
		boxHeight,
		setBoxHeight,
		validateFailed,
		setValidateFailed,
		updateFieldStats,
	};
}
