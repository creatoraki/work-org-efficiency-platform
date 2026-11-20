import type { Dayjs } from "dayjs";
import type { CascaderOption } from "../constants";

import { Cascader, DatePicker, Form, Input } from "antd";
import { Calendar } from "lucide-react";
import { useEffect } from "react";
import { findCascaderLabels, formatDateWithWeekday } from "../utils";
import { FormModalShell } from "./form-modal-shell";
import { MODAL_FORM_PROPS } from "./modal-form-props";

/** 新增 / 编辑文件夹表单值（字段对应 AppraisalFolderAddForm） */
export interface FolderFormValues {
	/** 所属组织级联路径（组织 code），末级 → belongToOrgCode */
	orgPath?: string[];
	/** 述职日期 → appraisalDate */
	appraisalDate?: Dayjs;
	/** 文件夹名称 → name */
	name?: string;
}

interface FolderFormModalProps {
	/** 是否打开 */
	open: boolean;
	/** 模式：新增 / 编辑（重命名） */
	mode: "create" | "rename";
	/** 所属组织级联选项 */
	orgOptions: CascaderOption[];
	/** 默认所属组织路径（回显当前选中层级） */
	defaultOrgPath?: string[];
	/** 编辑时的原文件夹名称 */
	defaultName?: string;
	/** 提交中 */
	confirmLoading?: boolean;
	/** 提交 */
	onSubmit: (values: FolderFormValues & { name: string }) => void;
	/** 取消 */
	onCancel: () => void;
}

/**
 * 新增 / 编辑文件夹弹窗（设计稿 08 / 14）
 *
 * 新增：所属组织（级联，默认回显当前层级）、述职日期、文件夹名称；
 * 选择组织和日期后，若名称未手动修改，按「组织名 + MM-DD 周X」自动生成建议名称（如「杭州区域公司12-12 周四」）。
 * 编辑：仅修改文件夹名称（后端修改接口要求回传原述职日期，由页面补齐）。
 *
 * @param props - 组件属性
 * @param props.open - 是否打开
 * @param props.mode - 模式：新增 / 编辑（重命名）
 * @param props.orgOptions - 所属组织级联选项
 * @param props.defaultOrgPath - 默认所属组织路径
 * @param props.defaultName - 编辑时的原文件夹名称
 * @param props.confirmLoading - 提交中
 * @param props.onSubmit - 提交
 * @param props.onCancel - 取消
 * @returns 弹窗
 *
 * @since 2026-11-16
 */
export function FolderFormModal({
	open,
	mode,
	orgOptions,
	defaultOrgPath,
	defaultName,
	confirmLoading,
	onSubmit,
	onCancel,
}: FolderFormModalProps) {
	const [form] = Form.useForm<FolderFormValues>();

	useEffect(() => {
		if (!open) {
			return;
		}
		form.resetFields();
		form.setFieldsValue({
			orgPath: defaultOrgPath?.length ? defaultOrgPath : undefined,
			name: mode === "rename" ? defaultName : undefined,
		});
	}, [open, mode, defaultOrgPath, defaultName, form]);

	/** 组织或日期变化时，名称未被手动修改则自动填充建议名称 */
	const handleValuesChange = (changed: Partial<FolderFormValues>, all: FolderFormValues) => {
		if (mode !== "create" || !("orgPath" in changed || "appraisalDate" in changed)) {
			return;
		}
		if (form.isFieldTouched("name")) {
			return;
		}
		const orgName = findCascaderLabels(orgOptions, all.orgPath).pop();
		if (orgName && all.appraisalDate) {
			form.setFieldValue(
				"name",
				`${orgName}${formatDateWithWeekday(all.appraisalDate, "MM-DD")}`,
			);
		}
	};

	return (
		<FormModalShell
			open={open}
			title={mode === "create" ? "新增文件夹" : "编辑"}
			confirmLoading={confirmLoading}
			onCancel={onCancel}
			// 校验失败由表单项就地提示，submit 不会抛出未处理的 Promise 异常
			onOk={() => form.submit()}
		>
			<Form
				form={form}
				{...MODAL_FORM_PROPS}
				onValuesChange={handleValuesChange}
				onFinish={(values) => onSubmit({ ...values, name: values.name?.trim() ?? "" })}
			>
				{mode === "create" ? (
					<>
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
							label="述职日期"
							name="appraisalDate"
							rules={[{ required: true, message: "请选择述职日期" }]}
						>
							<DatePicker
								className="w-full"
								placeholder="请选择"
								suffixIcon={
									<Calendar
										className="size-3.5 text-[#909399]"
										strokeWidth={1.5}
									/>
								}
							/>
						</Form.Item>
					</>
				) : null}
				<Form.Item
					label="文件夹名称"
					name="name"
					rules={[
						{ required: true, whitespace: true, message: "请输入文件夹名称" },
						{ max: 50, message: "文件夹名称不超过 50 个字" },
					]}
					extra={
						mode === "create" ? (
							<span className="mt-1 block text-sm leading-[22px] text-[#909399]">
								建议用地区-项目群-项目述职会命名-述职日期
							</span>
						) : undefined
					}
				>
					<Input placeholder="请输入" maxLength={50} />
				</Form.Item>
			</Form>
		</FormModalShell>
	);
}
