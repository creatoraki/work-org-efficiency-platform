import { SectionTitle } from "#src/components/section-title";
import { Alert, Skeleton } from "antd";

interface JobMatchingDrawerLoadingProps {
	// 是否为查看模式
	isViewMode?: boolean;
}

/**
 * 渲染基本信息区骨架行。
 *
 * 按真实表单与查看态描述区的标签宽度组织骨架，尽量减少加载前后的高度跳变。
 *
 * @param props - 组件属性
 * @param props.fieldWidth - 字段骨架宽度
 * @returns 单行骨架 JSX
 * @author 王善能
 * @since 2026-06-27
 */
function BasicInfoSkeletonRow({ fieldWidth }: { fieldWidth: number | string }) {
	return (
		<div className="flex items-center gap-4">
			<Skeleton.Input active size="small" style={{ width: 96, height: 18 }} />
			<Skeleton.Input active size="small" style={{ width: fieldWidth, height: 32 }} />
		</div>
	);
}

/**
 * 渲染候选人卡片骨架。
 *
 * 按真实候选人卡片的头像、匹配度和明细区块组织占位，
 * 查看态不展示右上角操作按钮，避免和真实只读卡片不一致。
 *
 * @param props - 组件属性
 * @param props.isViewMode - 是否为查看模式
 * @returns 候选人卡片骨架 JSX
 * @author 王善能
 * @since 2026-06-27
 */
function CandidateCardSkeleton({ isViewMode }: { isViewMode: boolean }) {
	return (
		<div className="min-h-[164px] rounded-lg border border-[#e6e8eb] bg-white px-4 pb-8 pt-3.5">
			<div className="mb-4 flex items-start justify-between gap-3">
				<div className="flex items-center gap-3">
					<Skeleton.Avatar active size={42} shape="circle" />
					<div className="flex flex-col gap-2">
						<Skeleton.Input active size="small" style={{ width: 88, height: 24 }} />
						<Skeleton.Input active size="small" style={{ width: 140, height: 16 }} />
					</div>
				</div>
				{!isViewMode && (
					<Skeleton.Button active size="small" shape="round" style={{ width: 72 }} />
				)}
			</div>

			<div className="mb-4 border-b border-[#f0f1f3] pb-4">
				<div className="mb-3 flex items-center justify-between gap-3">
					<Skeleton.Input active size="small" style={{ width: 56, height: 16 }} />
					<Skeleton.Input active size="small" style={{ width: 72, height: 24 }} />
				</div>
				<Skeleton.Input active size="small" block style={{ height: 8 }} />
			</div>

			<div className="grid grid-cols-2 gap-x-8 gap-y-3">
				{Array.from({ length: 6 }, (_, index) => `candidate-field-${index + 1}`).map(
					(key) => (
						<Skeleton.Input
							key={key}
							active
							size="small"
							style={{ width: "100%", height: 16 }}
						/>
					),
				)}
			</div>
		</div>
	);
}

/**
 * 人岗匹配抽屉加载骨架。
 *
 * 在编辑态与查看态请求详情期间，使用接近真实页面结构的骨架占位，
 * 避免显示空表单或大片空白，同时尽量控制加载前后的高度与布局跳变。
 *
 * @param props - 组件属性
 * @param props.isViewMode - 是否为查看模式
 * @returns 抽屉加载骨架 JSX
 * @author 王善能
 * @since 2026-06-27
 */
export function JobMatchingDrawerLoading({ isViewMode = false }: JobMatchingDrawerLoadingProps) {
	const candidateColumnsClassName = "grid grid-cols-1 gap-6 md:grid-cols-2";
	const candidateSkeletonCount = 2;

	return (
		<div className="flex h-full min-w-0 flex-col">
			{!isViewMode && (
				<Alert
					type="info"
					showIcon
					banner
					message='请先选择"所属组织""岗位-职位-职级"，再配置"匹配模型"'
				/>
			)}

			<div className="shrink-0 px-6 pt-6">
				<div className="mb-4">
					<SectionTitle title="人岗匹配基本信息" className="mb-6" />

					{isViewMode ? (
						<div className="space-y-6">
							<BasicInfoSkeletonRow fieldWidth={220} />
							<BasicInfoSkeletonRow fieldWidth={320} />
							<BasicInfoSkeletonRow fieldWidth={180} />
							<BasicInfoSkeletonRow fieldWidth={160} />
							<BasicInfoSkeletonRow fieldWidth={280} />
							<BasicInfoSkeletonRow fieldWidth={240} />
						</div>
					) : (
						<div className="space-y-6">
							<BasicInfoSkeletonRow fieldWidth="100%" />
							<BasicInfoSkeletonRow fieldWidth="100%" />

							<div className="flex items-start gap-3">
								<div className="min-w-0 flex-1">
									<BasicInfoSkeletonRow fieldWidth="100%" />
								</div>
								<div className="min-w-0 flex-1">
									<BasicInfoSkeletonRow fieldWidth="100%" />
								</div>
								<div className="min-w-0 flex-1">
									<BasicInfoSkeletonRow fieldWidth="100%" />
								</div>
								<div className="flex h-8 w-[172px] shrink-0 items-center gap-3">
									<div className="h-[14px] w-px bg-[#dcdfe6]" />
									<Skeleton.Input
										active
										size="small"
										style={{ width: 140, height: 16 }}
									/>
								</div>
							</div>

							<div className="flex items-start gap-6">
								<div className="min-w-0 flex-1">
									<BasicInfoSkeletonRow fieldWidth="100%" />
								</div>
								<div className="flex h-8 w-[96px] shrink-0 items-center gap-3">
									<div className="h-[14px] w-px bg-[#dcdfe6]" />
									<Skeleton.Input
										active
										size="small"
										style={{ width: 64, height: 16 }}
									/>
								</div>
							</div>

							<div className="flex justify-end gap-2">
								<Skeleton.Button active size="default" style={{ width: 88 }} />
								<Skeleton.Button active size="default" style={{ width: 64 }} />
							</div>
						</div>
					)}
				</div>

				<SectionTitle title="匹配候选人" className="pb-4" />
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-2">
				<div className={candidateColumnsClassName}>
					{Array.from(
						{ length: candidateSkeletonCount },
						(_, index) => `candidate-card-${index + 1}`,
					).map((key) => (
						<CandidateCardSkeleton key={key} isViewMode={isViewMode} />
					))}
				</div>
			</div>
		</div>
	);
}
