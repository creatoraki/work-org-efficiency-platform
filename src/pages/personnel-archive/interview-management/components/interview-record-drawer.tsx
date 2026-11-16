/**
 * 面谈记录抽屉组件（用于查看历史面谈记录）
 * 参考 archive-audit-drawer.tsx 的布局
 */

import { fetchInterviewHistoryWithUser } from "#src/api/personnel-archive/interview-management";
import { useQuery } from "@tanstack/react-query";
import { Drawer, Spin } from "antd";
import { BasicInfo } from "./basic-info";
import { InterviewHistoryList } from "./interview-history-list";

/**
 * 面谈记录抽屉属性接口
 */
interface InterviewRecordDrawerProps {
	/** 是否显示抽屉 */
	open: boolean;
	/** 面谈 ID，用于区分面谈记录查询上下文 */
	interviewId?: string;
	/** 面谈人ID */
	interviewUserId: string | number;
	/** 转派面谈人ID（可选） */
	assignInterviewUserId?: string | number | null;
	/** 用户ID */
	userId: number;
	/** 关闭回调 */
	onClose: () => void;
}

/**
 * 面谈记录抽屉
 *
 * @param props - 组件属性
 * @param props.open - 是否显示抽屉
 * @param props.interviewId - 面谈 ID，用于区分面谈记录查询上下文
 * @param props.interviewUserId - 面谈人ID
 * @param props.assignInterviewUserId - 转派面谈人ID（可选）
 * @param props.userId - 用户ID
 * @param props.onClose - 关闭回调
 * @returns 面谈记录抽屉
 */
export function InterviewRecordDrawer({
	open,
	interviewId,
	interviewUserId,
	assignInterviewUserId,
	userId,
	onClose,
}: InterviewRecordDrawerProps) {
	const normalizedInterviewUserId = Number(interviewUserId);
	const normalizedAssignInterviewUserId =
		assignInterviewUserId == null ? undefined : Number(assignInterviewUserId);
	const { data, isLoading } = useQuery({
		queryKey: [
			"interview-history",
			interviewId,
			userId,
			normalizedInterviewUserId,
			normalizedAssignInterviewUserId,
		],
		queryFn: () =>
			fetchInterviewHistoryWithUser(
				userId,
				normalizedInterviewUserId,
				normalizedAssignInterviewUserId,
			),
		enabled: open,
	});
	const basicInfoData = data?.user;
	const interviewHistory = data?.interviewHisList ?? [];

	return (
		<Drawer
			title="面谈记录"
			placement="right"
			width="clamp(500px, 55vw,95vw)"
			open={open}
			onClose={onClose}
			closable={{ placement: "end" }}
			destroyOnHidden
		>
			<Spin
				spinning={isLoading}
				size="large"
				wrapperClassName="h-full [&_.ant-spin-container]:h-full [&_.ant-spin-spinning]:!max-h-full"
			>
				<div className="h-full">
					{basicInfoData && (
						<div className="flex flex-col gap-4 lg:gap-5">
							{/* 基本信息 */}
							<BasicInfo data={basicInfoData} />

							{/* 过往面谈记录 */}
							<InterviewHistoryList interviewHistory={interviewHistory} />
						</div>
					)}
				</div>
			</Spin>
		</Drawer>
	);
}
