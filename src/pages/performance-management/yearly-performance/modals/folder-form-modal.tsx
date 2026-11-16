import type { YearlyReportCascaderOption } from "#src/api/performance-management/yearly-performance";
import type { Dayjs } from "dayjs";

import { Cascader, DatePicker, Form, Input } from "antd";
import { Calendar } from "lucide-react";
import { useEffect } from "react";
import { formatDateWithWeekday } from "../utils";
import { FormModalShell } from "./form-modal-shell";
import { MODAL_FORM_PROPS } from "./modal-form-props";

/** 新增 / 编辑文件夹表单值 */
export interface FolderFormValues {
	/** 所属组织级联路径 */
	orgPath?: string[];
	/** 述职日期 */
	reportDate?: Dayjs;
	/** 文件夹名称 */
	folderName?: string;
}

interface FolderFormModalProps {
	/** 是否打开 */
	open: boolean;
	/** 模式：新增 / 编辑（重命名） */
	mode: "create" | "rename";
	/** 所属组织级联选项 */
	orgOptions: YearlyReportCascaderOption[];
	/** 默认所属组织路径（回显当前选中层级） */
	defaultOrgPath?: string[];
	/** 编辑时的原文件夹名称 */
	defaultFolderName?: string;
	/** 提交中 */
	confirmLoading?: boolean;
	/** 提交 */
	onSubmit: (values: Required<Pick<FolderFormValues, "folderName">> & FolderFormValues) => void;
	/** 取消 */
	onCancel: () => void;
}

/**
 * 根据级联路径找到组织名称
 *
 * @param options - 级联选项
 * @param path - 级联路径
 * @returns 末级组织名称
 */
function findOrgLabel(options: YearlyReportCascaderOption[], path?: string[]) {
	let level = options;
	let label = "";
	for (const value of path ?? []) {
		const hit = level.find((option) => option.value === value);
		if (!hit) {
			return "";
		}
		label = hit.label;
		level = hit.children ?? [];
	}
	return label;
}

/**
 * 新增 / 编辑文件夹弹窗
 *
 * 新增：所属组织（级联，默认回显当前层级，只能选到可建文件夹的二级组织）、述职日期、文件夹名称；
 * 选择组织和日期后，若名称未手动修改，按「组织名 + MM-DD 周X」自动生成建议名称。
 * 编辑：仅修改文件夹名称。
 *
 * @param props - 组件属性
 * @param props.open - 是否打开
 * @param props.mode - 模式：新增 / 编辑（重命名）
 * @param props.orgOptions - 所属组织级联选项
 * @param props.defaultOrgPath - 默认所属组织路径（回显当前选中层级）
 * @param props.defaultFolderName - 编辑时的原文件夹名称
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
	defaultFolderName,
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
			folderName: mode === "rename" ? defaultFolderName : undefined,
		});
	}, [open, mode, defaultOrgPath, defaultFolderName, form]);

	/** 组织或日期变化时，名称未被手动修改则自动填充建议名称 */
	const handleValuesChange = (changed: Partial<FolderFormValues>, all: FolderFormValues) => {
		if (mode !== "create" || !("orgPath" in changed || "reportDate" in changed)) {
			return;
		}
		if (form.isFieldTouched("folderName")) {
			return;
		}
		const orgName = findOrgLabel(orgOptions, all.orgPath);
		if (orgName && all.reportDate) {
			form.setFieldValue(
				"folderName",
				`${orgName}${formatDateWithWeekday(all.reportDate.format("YYYY-MM-DD"))}`,
			);
		}
	};

	return (
		<FormModalShell
			open={open}
			title={mode === "create" ? "新增文件夹" : "编辑"}
			confirmLoading={confirmLoading}
			onCancel={onCancel}
			onOk={async () => {
				const values = await form.validateFields();
				onSubmit({ ...values, folderName: values.folderName?.trim() ?? "" });
			}}
		>
			<Form form={form} {...MODAL_FORM_PROPS} onValuesChange={handleValuesChange}>
				{mode === "create" ? (
					<>
						<Form.Item
							label="所属组织"
							name="orgPath"
							rules={[
								{ required: true, message: "请选择所属组织" },
								{
									validator: (_, value?: string[]) =>
										!value || value.length >= 2
											? Promise.resolve()
											: Promise.reject(
													new Error(
														"文件夹只能建在集团 / 地区公司 / 业务集团下的组织",
													),
												),
								},
							]}
						>
							<Cascader
								placeholder="请选择"
								options={orgOptions}
								displayRender={(labels) => labels.join("/")}
								allowClear={false}
							/>
						</Form.Item>
						<Form.Item
							label="述职日期"
							name="reportDate"
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
					name="folderName"
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
