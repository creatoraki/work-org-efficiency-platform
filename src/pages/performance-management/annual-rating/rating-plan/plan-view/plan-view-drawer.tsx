import type { RatingPlanItem } from "#src/api/performance-management/plan";
import type { PlanViewTab } from "../types";

import { Drawer, Tabs } from "antd";
import { useState } from "react";
import { AnalysisReportTab } from "./analysis-report-tab";
import { PeopleListTab } from "./people-list-tab";
import styles from "./plan-view-drawer.module.css";

/**
 * 计划查看弹窗属性
 */
interface PlanViewDrawerProps {
	/** 当前计划 */
	plan?: RatingPlanItem;
	/** 是否可见 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
}

/**
 * 计划查看抽屉
 *
 * 右侧抽屉，标题为计划名称，内容区以「人员清单 / 分析报表」两个 Tab 承载；
 * 人员清单左侧为自定义组织树。
 *
 * @param props - 组件属性
 * @param props.plan - 当前计划
 * @param props.open - 是否可见
 * @param props.onClose - 关闭回调
 * @returns 查看抽屉
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function PlanViewDrawer({ plan, open, onClose }: PlanViewDrawerProps) {
	const [tab, setTab] = useState<PlanViewTab>("people");

	return (
		<Drawer
			open={open}
			onClose={onClose}
			width={1536}
			className={styles.viewDrawer}
			title={
				<span className="text-[20px] font-semibold leading-[28px] text-[#323233]">
					{plan?.planName ?? "查看"}
				</span>
			}
		>
			<Tabs
				activeKey={tab}
				onChange={(key) => setTab(key as PlanViewTab)}
				items={[
					{
						key: "people",
						label: "人员清单",
						children: <PeopleListTab planName={plan?.planName} />,
					},
					{
						key: "analysis",
						label: "分析报表",
						children: <AnalysisReportTab />,
					},
				]}
			/>
		</Drawer>
	);
}
