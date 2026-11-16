/**
 * 人才档案区块标题空态提示
 *
 * @author 王善能
 * @date 2026-04-16
 */

import { InfoCircleOutlined } from "@ant-design/icons";

interface SectionEmptyHintProps {
	/** 提示文案 */
	text?: string;
}

/**
 * 区块标题右侧空态提示
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function SectionEmptyHint({ text = "暂无数据" }: SectionEmptyHintProps) {
	return (
		<div className="inline-flex items-center gap-1 rounded-full border border-[#E4EAF3] bg-[#F8FAFD] px-2.5 py-1 text-xs leading-5 text-[#8A94A6]">
			<InfoCircleOutlined className="text-[12px] text-[#A3ADC2]" />
			<span>{text}</span>
		</div>
	);
}
