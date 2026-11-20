import type { AppraisalFolder } from "#src/api/performance-management/yearly-performance";
import type { CascaderOption } from "../constants";

import { Cascader, Form, Select } from "antd";
import { useEffect } from "react";
import { useAppraisalFolders } from "../hooks/use-yearly-report-queries";
import { FormModalShell } from "./form-modal-shell";
import { MODAL_FORM_PROPS } from "./modal-form-props";

interface BatchMoveFormValues {
	/** 所属组织级联路径（组织 code） */
	orgPath?: string[];
	/** 目标文件夹 */
	folderId?: string;
}

interface BatchMoveModalProps {
	/** 是否打开 */
	open: boolean;
	/** 已选人数 */
	selectedCount: number;
	/** 所属组织级联选项 */
	orgOptions: CascaderOption[];
	/** 默认所属组织路径 */
	defaultOrgPath?: string[];
	/** 提交中 */
	confirmLoading?: boolean;
	/** 提交 */
	onSubmit: (folder: AppraisalFolder) => void;
	/** 取消 */
	onCancel: () => void;
}

/**
 * 批量移动弹窗（设计稿 11）
 *
 * 先选所属组织，再从该组织下的文件夹中选择目标；组织变化时清空已选文件夹。
 *
 * @param props - 组件属性
 * @param props.open - 是否打开
 * @param props.selectedCount - 已选人数
 * @param props.orgOptions - 所属组织级联选项
 * @param props.defaultOrgPath - 默认所属组织路径
 * @param props.confirmLoading - 提交中
 * @param props.onSubmit - 提交
 * @param props.onCancel - 取消
 * @returns 弹窗
 *
 * @since 2026-11-16
 */
export function BatchMoveModal({
	open,
	selectedCount,
	orgOptions,
	defaultOrgPath,
	confirmLoading,
	onSubmit,
	onCancel,
}: BatchMoveModalProps) {
	const [form] = Form.useForm<BatchMoveFormValues>();
	const orgPath = Form.useWatch("orgPath", form);
	const orgCode = orgPath?.[orgPath.length - 1];

	const {
		data = [],
		isFetching,
		isPlaceholderData,
	} = useAppraisalFolders({ belongToOrgCode: orgCode }, open && Boolean(orgCode));
	// keepPreviousData 会在切换组织时暂留上一组织的文件夹，新数据返回前不提供选项，避免误选
	const folders = orgCode && !isPlaceholderData ? data : [];

	useEffect(() => {
		if (!open) {
			return;
		}
		form.resetFields();
		form.setFieldsValue({ orgPath: defaultOrgPath?.length ? defaultOrgPath : undefined });
	}, [open, defaultOrgPath, form]);

	return (
		<FormModalShell
			open={open}
			title="批量移动"
			confirmLoading={confirmLoading}
			onCancel={onCancel}
			// 校验失败由表单项就地提示，submit 不会抛出未处理的 Promise 异常
			onOk={() => form.submit()}
		>
			<Form
				form={form}
				{...MODAL_FORM_PROPS}
				onValuesChange={(changed: Partial<BatchMoveFormValues>) => {
					if ("orgPath" in changed) {
						form.setFieldValue("folderId", undefined);
					}
				}}
				onFinish={(values) => {
					const target = folders.find((folder) => folder.id === values.folderId);
					if (target) {
						onSubmit(target);
					}
				}}
			>
				<Form.Item
					label="所属组织"
					name="orgPath"
					rules={[{ required: true, message: "请选择所属组织" }]}
				>
					<Cascader
						placeholder="请选择"
						options={orgOptions}
						changeOnSelect
						showSearch
						displayRender={(labels) => labels.join("/")}
						allowClear={false}
					/>
				</Form.Item>
				<Form.Item
					label="文件夹名称"
					name="folderId"
					rules={[{ required: true, message: "请选择文件夹" }]}
					extra={
						<span className="mt-1 block text-sm leading-[22px] text-[#909399]">
							已选中 {selectedCount} 人，移动后将从原文件夹移出
						</span>
					}
				>
					<Select
						placeholder={orgCode ? "请选择" : "请先选择所属组织"}
						loading={isFetching}
						disabled={!orgCode}
						showSearch
						optionFilterProp="label"
						notFoundContent="该组织下暂无文件夹，请先新增"
						options={folders.map((folder) => ({
							value: folder.id,
							label: folder.name,
						}))}
					/>
				</Form.Item>
			</Form>
		</FormModalShell>
	);
}
