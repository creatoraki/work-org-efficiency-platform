/**
 * 人员档案抽屉容器。
 *
 * @author 王善能
 * @date 2026-04-16
 */

import type { TalentArchiveDrawerProps } from "./types";

import EmptyDataSvg from "#src/assets/svg/empty-data.svg";
import { CloseOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useBoolean } from "ahooks";
import { Button, Drawer, Empty, Typography } from "antd";
import { useCallback, useEffect } from "react";

import { TalentPortraitDrawer } from "../talent-portrait-drawer";
import {
	AssessmentSection,
	BasicInfoSection,
	CompanyHistorySection,
	EducationSection,
	PersonalInfoSection,
	TagsSection,
	TrainingSection,
} from "./components";
import styles from "./talent-archive-drawer.module.css";
import { useTalentArchiveQueries } from "./use-talent-archive-queries";

const { Text } = Typography;

/**
 * 人员档案抽屉组件。
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function TalentArchiveDrawer({
	open,
	userId,
	matchRate,
	isCandidateMode = false,
	isCurrent = false,
	currentIndex = 0,
	totalCount = 0,
	canPrevious = false,
	canNext = false,
	onPrevious,
	onNext,
	onClose,
}: TalentArchiveDrawerProps) {
	const enableSwitchMode = isCandidateMode === true;
	const archive = useTalentArchiveQueries(userId, Boolean(userId) && open);
	const [isPortraitOpen, { setTrue: openPortrait, setFalse: closePortrait }] = useBoolean(false);
	const {
		basicInfo,
		detailLoading,
		detailError,
		retryDetail,
		tags,
		tagsLoading,
		tagsLoadFailed,
		retryTags,
		companyHistory,
		companyHistoryLoading,
		companyHistoryLoadFailed,
		retryCompanyHistory,
		assessments,
		educations,
		trainings,
	} = archive;

	/**
	 * 人员切换或主抽屉显隐变化时关闭人才画像，避免残留上一次查看状态。
	 */
	useEffect(() => {
		closePortrait();
	}, [open, userId, closePortrait]);

	/**
	 * 关闭人才档案及其子级人才画像抽屉。
	 *
	 * @returns 无返回值。
	 *
	 * @author 王善能
	 * @since 2026-07-15
	 */
	const handleClose = useCallback(() => {
		closePortrait();
		onClose();
	}, [closePortrait, onClose]);

	return (
		<Drawer
			title={
				<div className="flex items-center justify-between pr-8">
					<span>人才档案</span>
					{enableSwitchMode && totalCount > 1 && (
						<div className="flex items-center gap-2">
							<Button
								type="text"
								icon={<LeftOutlined />}
								size="small"
								disabled={!canPrevious}
								onClick={onPrevious}
							>
								上一个
							</Button>
							<Text type="secondary" className="text-sm">
								{currentIndex}/{totalCount}
							</Text>
							<Button
								type="text"
								icon={<RightOutlined />}
								size="small"
								disabled={!canNext}
								onClick={onNext}
							>
								下一个
							</Button>
						</div>
					)}
				</div>
			}
			placement="right"
			width="clamp(1200px, 80vw, 1520px)"
			open={open}
			onClose={handleClose}
			destroyOnHidden
			loading={detailLoading}
			closable={false}
			styles={{
				body: {
					padding: detailLoading ? 24 : 0,
					overflow: "hidden",
				},
			}}
			extra={
				<Button
					type="text"
					icon={<CloseOutlined />}
					onClick={handleClose}
					className="text-gray-500 hover:text-gray-700"
				/>
			}
		>
			{detailError ? (
				<div className="flex h-full flex-col items-center justify-center gap-3 px-6">
					<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="人才档案加载失败" />
					<Button type="primary" onClick={retryDetail}>
						重新加载
					</Button>
				</div>
			) : basicInfo ? (
				<div className="flex h-full min-h-0 flex-col">
					<div className="relative shrink-0 overflow-hidden bg-white px-6 py-5">
						<div
							className={`pointer-events-none absolute left-[30%] top-[-64px] h-[208px] w-[647px] -translate-x-1/2 rounded-full ${styles.greenGlow}`}
						/>
						<div
							className={`pointer-events-none absolute left-[70%] top-[-64px] h-[189px] w-[583px] -translate-x-1/2 rounded-full ${styles.blueGlow}`}
						/>
						<div
							className={`pointer-events-none absolute inset-x-0 bottom-0 h-24 ${styles.bottomFade}`}
						/>
						<div className="relative z-[1]">
							<BasicInfoSection
								data={basicInfo}
								matchRate={matchRate ?? basicInfo.matchRate}
								isCandidateMode={isCandidateMode}
								isCurrent={isCurrent}
							/>
						</div>
					</div>
					<div className="custom-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pb-6 pt-2">
						<TagsSection
							userId={basicInfo.userId}
							tags={tags}
							loading={tagsLoading}
							error={tagsLoadFailed}
							onRetry={retryTags}
							onPortraitOpen={openPortrait}
						/>

						<PersonalInfoSection data={basicInfo} />

						<CompanyHistorySection
							data={companyHistory}
							loading={companyHistoryLoading}
							error={companyHistoryLoadFailed}
							onRetry={retryCompanyHistory}
						/>

						<AssessmentSection data={assessments} />

						<EducationSection data={educations} />

						<TrainingSection data={trainings} />
					</div>
				</div>
			) : (
				<div className="flex h-full items-center justify-center">
					<Empty image={EmptyDataSvg} description="暂无数据" />
				</div>
			)}
			<TalentPortraitDrawer
				open={isPortraitOpen}
				userId={basicInfo?.userId ?? ""}
				basicInfo={basicInfo}
				educations={educations}
				assessments={assessments}
				tags={tags}
				onClose={closePortrait}
			/>
		</Drawer>
	);
}
