import type { ImportRecord } from "../types";
import { Badge } from "antd";
import React from "react";
import { STATUS_BADGE_MAP } from "../constants";
import { getImportStatusLabel } from "../import-center/utils";

interface ImportStatusBadgeProps {
	record: ImportRecord;
}

/**
 * 导入状态徽章组件
 */
export const ImportStatusBadge: React.FC<ImportStatusBadgeProps> = React.memo(({ record }) => {
	const { status, statusFormat, progress } = record;
	const badgeStatus = STATUS_BADGE_MAP[status];
	const text =
		status === 2 && progress !== undefined
			? `${getImportStatusLabel(status)}(${progress || 0}%)`
			: getImportStatusLabel(status) || statusFormat;

	return <Badge status={badgeStatus} text={text} />;
});

ImportStatusBadge.displayName = "ImportStatusBadge";
