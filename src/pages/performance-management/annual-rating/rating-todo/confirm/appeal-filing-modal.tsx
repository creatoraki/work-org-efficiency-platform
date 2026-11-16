import type { AppealFilingPayload } from "#src/api/performance-management/confirm";
import type { UploadFile } from "antd";

import {
	useConfirmDetail,
	useSubmitAppealFiling,
} from "#src/pages/performance-management/annual-rating/rating-todo/confirm/hooks/use-confirm";
import { CloseCircleOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { Button, Drawer, Form, Input, InputNumber, message, Radio, Select, Upload } from "antd";
import { useCallback, useMemo, useState } from "react";

/** 申诉等级选项 */
const APPEAL_LEVEL_OPTIONS = ["A", "B+", "B", "C", "D"].map((level) => ({
	label: level,
	value: level,
}));

/** 佐证材料格式 */
type MaterialType = "photo" | "attachment";

/**
 * 申诉类型选项
 */
const APPEAL_TYPE_OPTIONS = [
	{ label: "集团本体", value: "集团本体" },
	{ label: "业务/地区本体", value: "业务/地区本体" },
];

/**
 * 发起申诉弹窗组件属性
 */
interface AppealFilingModalProps {
	/** 待办标识 */
	todoId: string;
	/** 弹窗是否可见 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 提交成功回调 */
	onSubmitted: () => void;
}

/** 佐证材料限制：照片 5M / 附件 60M */
const PHOTO_MAX_SIZE = 5 * 1024 * 1024;
const ATTACHMENT_MAX_SIZE = 60 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png"];
const ATTACHMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];

/**
 * 校验上传文件的大小与类型
 *
 * @param file - 上传文件
 * @param types - 允许的 MIME 类型
 * @param maxSize - 单文件大小上限（字节）
 * @returns 是否允许上传
 */
function validateMaterial(file: File, types: string[], maxSize: number): boolean {
	if (!types.includes(file.type)) {
		message.error("文件格式不支持");
		return false;
	}
	if (file.size > maxSize) {
		message.error(`单个文件不能超过 ${Math.round(maxSize / 1024 / 1024)}M`);
		return false;
	}
	return true;
}

/**
 * 发起申诉弹窗
 *
 * 展示考评得分/考评等级，填写申诉类型、申诉得分、申诉等级、申诉原因，
 * 并按「照片」或「附件」两种格式上传佐证材料。
 * 佐证材料在后端接口就绪前仅本地收集，不实际上传。
 *
 * @param props - 组件属性
 * @param props.todoId - 待办标识
 * @param props.open - 弹窗是否可见
 * @param props.onClose - 关闭回调
 * @param props.onSubmitted - 提交成功回调
 * @returns 发起申诉弹窗组件
 *
 * @author 王善能
 * @since 2026-11-11
 */
export function AppealFilingModal({ todoId, open, onClose, onSubmitted }: AppealFilingModalProps) {
	const { data: confirmData } = useConfirmDetail(todoId, open);
	const [form] = Form.useForm();
	const submitMutation = useSubmitAppealFiling();
	const [materialType, setMaterialType] = useState<MaterialType>("photo");
	const [fileList, setFileList] = useState<UploadFile[]>([]);
	/** 申诉原因实时字数，用于在输入框下方展示计数 */
	const appealReason = Form.useWatch<string>("appealReason", form);

	/** 照片：最多 9 张，单张 ≤5M */
	const photoProps = useMemo(
		() => ({
			accept: ".jpg,.jpeg,.png",
			maxCount: 9,
			listType: "picture-card" as const,
		}),
		[],
	);

	/** 附件：最多 5 个，单个 ≤60M */
	const attachmentProps = useMemo(
		() => ({
			accept: ".pdf,.jpg,.jpeg,.png",
			maxCount: 5,
		}),
		[],
	);

	/**
	 * 切换佐证材料格式时清空已选文件
	 */
	const handleMaterialTypeChange = useCallback((next: MaterialType) => {
		setMaterialType(next);
		setFileList([]);
	}, []);

	/**
	 * 提交申诉
	 */
	const handleOk = useCallback(async () => {
		const values = await form.validateFields();
		const payload: AppealFilingPayload = {
			todoId,
			appealType: values.appealType,
			appealScore: values.appealScore,
			appealLevel: values.appealLevel,
			appealReason: values.appealReason,
			materialType,
			// TODO(接口就绪): 改为上传后的文件标识列表
			materialFileIds: fileList.map((f) => f.uid),
		};
		submitMutation.mutate(payload, {
			onSuccess: () => {
				message.success("申诉提交成功");
				form.resetFields();
				setFileList([]);
				onSubmitted();
				onClose();
			},
		});
	}, [form, todoId, materialType, fileList, submitMutation, onSubmitted, onClose]);

	return (
		<Drawer
			placement="right"
			width={680}
			title={<span className="text-xl font-semibold leading-7 text-[#323233]">发起申诉</span>}
			open={open}
			onClose={onClose}
			closeIcon={<CloseCircleOutlined className="text-[26px] text-[#323233]" />}
			styles={{
				header: { padding: "12px 24px", borderBottom: "1px solid #EBEEF5" },
				footer: { padding: 0 },
			}}
			footer={
				<div>
					<div className="flex items-center gap-2 bg-[#FFEFE0] px-4 py-2 text-sm leading-[22px] text-[#323233]">
						<ExclamationCircleFilled className="shrink-0 text-base text-[#FF7D00]" />
						<span>申诉提交后由所选受理人处理，处理期间确认操作暂停</span>
					</div>
					<div className="flex justify-end gap-2 px-6 py-3">
						<Button onClick={onClose}>取消</Button>
						<Button
							type="primary"
							loading={submitMutation.isPending}
							onClick={handleOk}
						>
							提交
						</Button>
					</div>
				</div>
			}
		>
			{/* 考评结果 */}
			<div className="mb-6 flex gap-6">
				<div className="flex-1 rounded border border-[#EBEEF5] px-3 py-1.5">
					<div className="mb-2 text-base leading-6 text-[#0075FF]">考评得分</div>
					<div className="text-xl font-normal leading-7 text-[#0075FF]">
						{(confirmData?.evalResult.evalScore ?? 0).toFixed(2)}
					</div>
				</div>
				<div className="flex-1 rounded border border-[#EBEEF5] px-3 py-1.5">
					<div className="mb-2 text-base leading-6 text-[#0075FF]">考评等级</div>
					<div className="text-xl font-normal leading-7 text-[#0075FF]">
						{confirmData?.evalResult.evalLevel ?? ""}
					</div>
				</div>
			</div>

			<Form form={form} layout="horizontal" labelCol={{ flex: "96px" }} colon={false}>
				<Form.Item
					name="appealType"
					label="申诉类型"
					rules={[{ required: true, message: "请选择申诉类型" }]}
				>
					<Radio.Group className="flex gap-12" options={APPEAL_TYPE_OPTIONS} />
				</Form.Item>

				<Form.Item
					name="appealScore"
					label="申诉得分"
					rules={[{ required: true, message: "请输入申诉得分" }]}
				>
					<InputNumber className="w-full" min={0} placeholder="请输入" />
				</Form.Item>

				<Form.Item
					name="appealLevel"
					label="申诉等级"
					rules={[{ required: true, message: "请选择申诉等级" }]}
				>
					<Select placeholder="请选择" options={APPEAL_LEVEL_OPTIONS} />
				</Form.Item>

				<Form.Item
					name="appealReason"
					label="申诉原因"
					rules={[{ min: 10, message: "申诉原因不少于 10 个字" }]}
					extra={
						<div className="-mt-1.5 text-right text-xs leading-5 text-[#323233]">
							{appealReason?.length ?? 0}/100
						</div>
					}
				>
					<Input.TextArea
						rows={4}
						maxLength={100}
						placeholder="请说明申诉原因(不少于10个字)。例:全年完成3个重难点项目，KPI完成度98%，建议复核评定等级"
					/>
				</Form.Item>

				<Form.Item label="佐证材料格式">
					<Radio.Group
						className="flex gap-12"
						value={materialType}
						onChange={(e) => handleMaterialTypeChange(e.target.value)}
						options={[
							{ label: "照片", value: "photo" },
							{ label: "附件", value: "attachment" },
						]}
					/>
				</Form.Item>

				<Form.Item label="佐证材料">
					{materialType === "photo" ? (
						<div>
							<Upload
								{...photoProps}
								className="[&_.ant-upload-select]:!size-[88px] [&_.ant-upload-select]:!rounded-[3px] [&_.ant-upload-select]:!border-0 [&_.ant-upload-select]:!bg-transparent [&_.ant-upload-select]:!p-0"
								beforeUpload={(file) => {
									if (!validateMaterial(file, PHOTO_TYPES, PHOTO_MAX_SIZE)) {
										return Upload.LIST_IGNORE;
									}
									return false;
								}}
								fileList={fileList}
								onChange={({ fileList: next }) => setFileList(next)}
							>
								{fileList.length >= photoProps.maxCount ? null : (
									<div className="flex size-[88px] flex-col items-center justify-center rounded-[3px] border border-dashed border-[#DCDFE6] bg-[#F0F2F5] text-[#909399]">
										<span className="text-2xl leading-none">+</span>
										<span className="mt-1 text-xs leading-5">点击上传图片</span>
									</div>
								)}
							</Upload>
							<div className="mt-2 text-xs text-[#909399]">
								支持上传JPG/PNG/JPEG格式，且单张不超过5M，最多上传9张
							</div>
						</div>
					) : (
						<div>
							<Upload
								{...attachmentProps}
								beforeUpload={(file) => {
									if (
										!validateMaterial(
											file,
											ATTACHMENT_TYPES,
											ATTACHMENT_MAX_SIZE,
										)
									) {
										return Upload.LIST_IGNORE;
									}
									return false;
								}}
								fileList={fileList}
								onChange={({ fileList: next }) => setFileList(next)}
							>
								<Button icon={<span className="mr-1">⬆</span>}>上传文件</Button>
							</Upload>
							<div className="mt-2 text-xs text-[#909399]">
								支持上传PDF/JPG/PNG/JPEG格式，最多上传5个，且单个不超过60M
							</div>
						</div>
					)}
				</Form.Item>
			</Form>
		</Drawer>
	);
}
