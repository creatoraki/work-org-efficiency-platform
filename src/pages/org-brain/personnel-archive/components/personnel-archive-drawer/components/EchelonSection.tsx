import type { TalentArchiveEchelonInfo } from "#src/api/org-brain/personnel-archive";
import type { ProDescriptionsItemProps } from "@ant-design/pro-components";

import { SectionTitle } from "#src/components";
import { ProDescriptions } from "@ant-design/pro-components";
import { Typography } from "antd";

import { useMemo } from "react";
import { PRO_DESCRIPTIONS_LABEL_STYLE } from "./styles";

const { Text } = Typography;

interface EchelonSectionProps {
	/** 梯队信息数据 */
	data?: TalentArchiveEchelonInfo;
}

/**
 * 梯队信息区块组件
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function EchelonSection({ data }: EchelonSectionProps) {
	// 配置项
	const columns: ProDescriptionsItemProps[] = useMemo(
		() => [
			{ label: "所在梯队", children: data?.echelonName || "/" },
			{ label: "继任准备度", children: data?.successionReadiness || "/" },
		],
		[data],
	);

	if (!data) {
		return (
			<div>
				<SectionTitle title="梯队信息" className="mb-3" />
				<Text type="secondary">暂无梯队信息</Text>
			</div>
		);
	}

	return (
		<div>
			<SectionTitle title="梯队信息" className="mb-3" />
			<ProDescriptions
				column={2}
				colon={false}
				styles={{ label: PRO_DESCRIPTIONS_LABEL_STYLE }}
				columns={columns}
			/>
		</div>
	);
}
