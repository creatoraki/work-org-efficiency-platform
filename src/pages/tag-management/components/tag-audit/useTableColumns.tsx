import type { DictDataItem } from "#src/api/system/dict/types";
import type { TagAuditListItem } from "#src/api/tag-management/tag-audit";
import type { ProColumns } from "@ant-design/pro-components";
import { BasicButton } from "#src/components/basic-button";
import { Badge, Typography } from "antd";
import { useMemo } from "react";
import { IS_REQUIRED_OPTIONS, TAG_MANAGEMENT_PERMISSIONS } from "../../config";

const { Link } = Typography;

/**
 * 表格列配置 Hook 参数
 */
interface UseTableColumnsParams {
	/** 标签类型选项 */
	tagTypeOptions: Array<{ label: string; value: string }> | undefined;
	/** 业务类别选项 */
	businessCategoryOptions: Array<{ label: string; value: string; children?: any[] }>;
	/** 审核状态选项 */
	auditStatusOptions: Array<{ label: string; value: string }>;
	/** 审核状态值映射 */
	auditStatusValueMap: Map<string, DictDataItem>;
	/** 提交人选项 */
	submitterOptions: Array<{ userId: string; userName: string }>;
	/** 审核人选项 */
	auditorOptions: Array<{ userId: string; userName: string }>;
	/** 审核操作回调 */
	onAudit: (record: TagAuditListItem) => void;
	/** 查看审核详情回调 */
	onViewRecords: (record: TagAuditListItem) => void;
}

/**
 * 表格列配置 Hook
 *
 * 生成标签审核列表的表格列配置
 *
 * @param params - Hook 参数
 * @param params.tagTypeOptions - 标签类型选项
 * @param params.businessCategoryOptions - 业务类别选项
 * @param params.auditStatusOptions - 审核状态选项
 * @param params.auditStatusValueMap - 审核状态值映射
 * @param params.submitterOptions - 提交人选项
 * @param params.auditorOptions - 审核人选项
 * @param params.onAudit - 审核操作回调
 * @param params.onViewRecords - 查看审核详情回调
 * @returns 表格列配置数组
 */
export function useTableColumns({
	tagTypeOptions,
	businessCategoryOptions,
	auditStatusOptions,
	auditStatusValueMap,
	submitterOptions,
	auditorOptions,
	onAudit,
	onViewRecords,
}: UseTableColumnsParams): ProColumns<TagAuditListItem>[] {
	return useMemo(
		() => [
			{
				title: "标签名称",
				dataIndex: "tagName",
				key: "tagName",
				width: 200,
				ellipsis: true,
				hideInSearch: false,
				valueType: "text",
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					placeholder: "请输入标签名称",
					variant: "borderless",
				},
			},
			{
				title: "标签值",
				dataIndex: "tagValue",
				key: "tagValue",
				width: 200,
				hideInSearch: false,
				valueType: "text",
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					placeholder: "请输入标签值",
					variant: "borderless",
				},
			},
			{
				title: "标签描述",
				dataIndex: "tagDescription",
				key: "tagDescription",
				width: 200,
				hideInSearch: false,
				valueType: "text",
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					placeholder: "请输入标签描述",
					variant: "borderless",
				},
				render: (_, record: TagAuditListItem) => (
					<Typography.Text
						ellipsis={{
							tooltip: record.tagDescription,
						}}
					>
						{record.tagDescription}
					</Typography.Text>
				),
			},
			{
				title: "标签类型",
				dataIndex: "tagTypeName",
				key: "tagType",
				width: 100,
				hideInSearch: false,
				valueType: "select",
				formItemProps: {
					name: "tagType",
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					mode: "multiple",
					showSearch: true,
					optionFilterProp: "label",
					options: tagTypeOptions || [],
					variant: "borderless",
				},
			},
			{
				title: "业务类别",
				dataIndex: "businessCategoryName",
				key: "businessCategory",
				width: 150,
				ellipsis: true,
				hideInSearch: false,
				valueType: "cascader",
				formItemProps: {
					name: "businessCategory",
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					options: businessCategoryOptions,
					showSearch: true,
					changeOnSelect: true,
					variant: "borderless",
				},
			},
			{
				title: "是否必填",
				dataIndex: "isRequiredName",
				key: "isRequired",
				width: 100,
				hideInSearch: false,
				valueType: "select",
				formItemProps: {
					name: "isRequired",
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					mode: "multiple",
					showSearch: true,
					optionFilterProp: "label",
					options: IS_REQUIRED_OPTIONS,
					variant: "borderless",
				},
			},
			{
				title: "到期时间",
				dataIndex: "existenceCycle",
				key: "existenceCycle",
				width: 100,
				hideInSearch: false,
				valueType: "date",
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					variant: "borderless",
					format: "YYYY-MM-DD",
					placeholder: "请选择到期时间",
				},
			},
			{
				title: "更新频次",
				dataIndex: "updateFrequencyName",
				key: "updateFrequency",
				width: 100,
				hideInSearch: true,
			},
			{
				title: "状态",
				dataIndex: "auditStatusName",
				key: "auditStatus",
				width: 100,
				hideInSearch: false,
				valueType: "select",
				formItemProps: {
					name: "auditStatus",
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					mode: "multiple",
					showSearch: true,
					optionFilterProp: "label",
					options: auditStatusOptions,
					variant: "borderless",
				},
				initialValue: ["0"], // 默认选中待审核
				render: (_, record: TagAuditListItem) => {
					const dictItem = auditStatusValueMap.get(record.auditStatus);
					const status = dictItem?.listClass as
						| "default"
						| "success"
						| "processing"
						| "error"
						| "warning"
						| undefined;
					return <Badge status={status} text={record.auditStatusName} />;
				},
			},
			{
				title: "提交人",
				dataIndex: "submitterName",
				key: "submitter",
				width: 100,
				hideInSearch: false,
				valueType: "select",
				formItemProps: {
					name: "submitter",
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					variant: "borderless",
					showSearch: true,
					optionFilterProp: "userName",
					options: submitterOptions,
					fieldNames: { label: "userName", value: "userId" },
				},
			},
			{
				title: "审核人",
				dataIndex: "auditorName",
				key: "auditor",
				width: 100,
				hideInSearch: false,
				valueType: "select",
				formItemProps: {
					name: "auditor",
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					variant: "borderless",
					showSearch: true,
					optionFilterProp: "userName",
					options: auditorOptions,
					fieldNames: { label: "userName", value: "userId" },
				},
			},
			{
				title: "更新时间",
				dataIndex: "updateTime",
				key: "updateTime",
				width: 150,
				valueType: "dateTime",
				hideInSearch: true,
			},
			{
				title: "操作",
				key: "action",
				valueType: "option",
				width: 80,
				fixed: "right",
				render: (_: any, record: TagAuditListItem) => {
					const status = record.auditStatus;
					// 状态 "0"（待审核）显示"审核"，状态 "1"（已通过）和 "2"（已拒绝）显示"审核详情"
					if (status === "0") {
						return (
							<BasicButton
								type="link"
								onClick={() => onAudit(record)}
								auth={TAG_MANAGEMENT_PERMISSIONS.TAG_APPROVE_APPROVE}
							>
								审核
							</BasicButton>
						);
					}
					if (status === "1" || status === "2") {
						return <Link onClick={() => onViewRecords(record)}>审核详情</Link>;
					}
					return null;
				},
			},
		],
		[
			tagTypeOptions,
			businessCategoryOptions,
			auditStatusOptions,
			auditStatusValueMap,
			submitterOptions,
			auditorOptions,
			onAudit,
			onViewRecords,
		],
	);
}
