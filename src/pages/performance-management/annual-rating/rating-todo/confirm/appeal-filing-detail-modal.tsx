import type { AppealMaterial } from "#src/api/performance-management/confirm";
import type { ReactNode } from "react";

import ChevronRightIcon from "#src/assets/svg/chevron-right.svg?react";
import { SectionTitle } from "#src/pages/performance-management/annual-rating/components/section-title";
import { useAppealFilingDetail } from "#src/pages/performance-management/annual-rating/rating-todo/confirm/hooks/use-confirm";
import { CloseCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import { Drawer, Image } from "antd";
import { useMemo } from "react";

/** 照片网格最多展示的缩略图数量，超出部分以 +N 遮罩提示 */
const MAX_THUMBNAILS = 2;

/**
 * 申诉详情弹窗组件属性
 */
interface AppealFilingDetailModalProps {
	/** 待办标识 */
	todoId: string;
	/** 申诉流程编号 */
	appealNo: string;
	/** 弹窗是否可见 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
}

/**
 * 字段展示行
 *
 * 标签列固定 92px 右对齐、与值间距 24px；单行行高 34px，宽行按内容自适应。
 *
 * @param props - 组件属性
 * @param props.label - 字段名
 * @param props.value - 字段值
 * @param props.wide - 是否占满整行
 * @param props.columnClass - 所在列的左右留白类名
 * @returns 字段元素
 */
function DetailField({
	label,
	value,
	wide = false,
	columnClass = "",
}: {
	label: string;
	value: ReactNode;
	wide?: boolean;
	columnClass?: string;
}) {
	return (
		<div
			className={`flex gap-6 py-1.5 ${
				wide ? "col-span-2 items-start" : "h-[34px] items-center"
			} ${columnClass}`}
		>
			<span className="w-[92px] shrink-0 whitespace-nowrap text-right text-sm leading-[22px] text-[#606266]">
				{label}
			</span>
			<span className="min-w-0 flex-1 text-sm leading-[22px] text-black">{value}</span>
		</div>
	);
}

/**
 * 佐证材料：照片缩略图网格
 *
 * 展示前 N 张缩略图，超出部分在最后一张上叠加 +N 遮罩；
 * 点击可放大预览全部图片。
 *
 * @param props - 组件属性
 * @param props.materials - 佐证材料列表
 * @returns 缩略图网格元素
 */
function PhotoGrid({ materials }: { materials: AppealMaterial[] }) {
	const photos = useMemo(() => materials.filter((m) => Boolean(m.url)), [materials]);
	if (photos.length === 0) {
		return <span className="text-sm text-[#909399]">暂无照片</span>;
	}
	const visible = photos.slice(0, MAX_THUMBNAILS);
	const restCount = photos.length - visible.length;

	return (
		<Image.PreviewGroup items={photos.map((p) => p.url!)}>
			<div className="flex gap-2">
				{visible.map((photo, index) => (
					<div
						key={photo.id}
						className="relative size-[72px] overflow-hidden rounded border border-[#E4E7ED]"
					>
						<Image
							src={photo.url}
							alt={photo.name}
							width={72}
							height={72}
							className="object-cover"
							preview={{ mask: "预览" }}
						/>
						{index === visible.length - 1 && restCount > 0 ? (
							<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white">
								+{restCount}
							</div>
						) : null}
					</div>
				))}
			</div>
		</Image.PreviewGroup>
	);
}

/**
 * 佐证材料：附件文件列表
 *
 * @param props - 组件属性
 * @param props.materials - 佐证材料列表
 * @returns 文件列表元素
 */
function AttachmentList({ materials }: { materials: AppealMaterial[] }) {
	if (materials.length === 0) {
		return <span className="text-sm text-[#909399]">暂无附件</span>;
	}
	return (
		<ul className="flex flex-col gap-1">
			{materials.map((item) => (
				<li key={item.id} className="flex items-center gap-1.5 text-sm text-[#303133]">
					<FileTextOutlined className="text-[#909399]" />
					<span className="max-w-full truncate" title={item.name}>
						{item.name}
					</span>
				</li>
			))}
		</ul>
	);
}

/**
 * 申诉详情弹窗
 *
 * 展示申诉得分、申诉等级、申诉类型、申诉流程编号、申诉原因
 * 与佐证材料（按「照片」或「附件」两种格式渲染）。
 *
 * @param props - 组件属性
 * @param props.todoId - 待办标识
 * @param props.appealNo - 申诉流程编号
 * @param props.open - 弹窗是否可见
 * @param props.onClose - 关闭回调
 * @returns 申诉详情弹窗组件
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function AppealFilingDetailModal({
	todoId,
	appealNo,
	open,
	onClose,
}: AppealFilingDetailModalProps) {
	const { data, isLoading } = useAppealFilingDetail(todoId, appealNo, open);
	const isPhoto = data?.materialType === "photo";

	return (
		<Drawer
			placement="right"
			width={680}
			title={<span className="text-xl font-semibold leading-7 text-[#323233]">申诉详情</span>}
			open={open}
			onClose={onClose}
			loading={isLoading}
			destroyOnHidden
			closeIcon={<CloseCircleOutlined className="text-[26px] text-[#323233]" />}
			styles={{
				header: { padding: "12px 24px", borderBottom: "1px solid #EBEEF5" },
			}}
			footer={null}
		>
			{/* 考评结果 */}
			<div className="mb-6 mt-2 flex gap-6">
				<div className="flex-1 rounded border border-[#EBEEF5] px-3 py-1.5">
					<div className="mb-2 text-base leading-6 text-[#0075FF]">考评得分</div>
					<div className="text-xl font-normal leading-7 text-[#0075FF]">
						{(data?.evalScore ?? 0).toFixed(2)}
					</div>
				</div>
				<div className="flex-1 rounded border border-[#EBEEF5] px-3 py-1.5">
					<div className="mb-2 text-base leading-6 text-[#0075FF]">考评等级</div>
					<div className="text-xl font-normal leading-7 text-[#0075FF]">
						{data?.evalLevel ?? ""}
					</div>
				</div>
			</div>

			{/* 申诉信息 */}
			<div>
				<SectionTitle title="申诉信息" />
				<div className="grid grid-cols-2">
					<DetailField
						label="申诉得分"
						value={(data?.appealScore ?? 0).toFixed(2)}
						columnClass="pr-6"
					/>
					<DetailField
						label="申诉等级"
						value={data?.appealLevel ?? ""}
						columnClass="pl-6"
					/>
					<DetailField
						label="申诉类型"
						value={data?.appealType ?? ""}
						columnClass="pr-6"
					/>
					<DetailField
						label="申诉流程编号"
						value={
							<span className="flex items-center gap-1 text-[#0075FF]">
								{data?.appealNo ?? appealNo}
								<ChevronRightIcon className="size-5 shrink-0" />
							</span>
						}
						columnClass="pl-6"
					/>
					<DetailField label="申诉原因" value={data?.appealReason ?? ""} wide />
					<div className="col-span-2 flex items-start gap-6 py-1.5">
						<span className="w-[92px] shrink-0 whitespace-nowrap text-right text-sm leading-[22px] text-[#606266]">
							佐证材料
						</span>
						<div className="min-w-0 flex-1">
							{isPhoto ? (
								<PhotoGrid materials={data?.materials ?? []} />
							) : (
								<AttachmentList materials={data?.materials ?? []} />
							)}
						</div>
					</div>
				</div>
			</div>
		</Drawer>
	);
}
