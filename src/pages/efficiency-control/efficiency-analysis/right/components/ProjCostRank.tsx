import { BasicTable } from "#src/components";
import { CloseOutlined } from "@ant-design/icons";
import { Badge, Button, Drawer, Select } from "antd";

import { useRef } from "react";
import { useOrgStore, useStructure } from "../../store";
import { fakeData2 } from "../config";

interface ProjCostRankProps {
	// role: RoleItemType
	open: boolean;
	setOpen: (open: boolean) => void;
	record: any;
}
export default function ProjCostRank(props: ProjCostRankProps) {
	const { open, setOpen } = props;
	const { org_tag: _org_tag } = useOrgStore();
	const { structure, structureTitle: _structureTitle } = useStructure();

	const actionRef = useRef<any>();
	const formRef = useRef<any>();
	const onClose = () => {
		setOpen(false);
	};

	const getColumns = () => {
		return [
			{
				title: "排名",
				dataIndex: "rank",
				hideInSearch: true,
			},
			{
				title: "区域",
				dataIndex: "region",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
				},
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={[]}
						/>
					);
				},
			},
			{
				title: "地区",
				dataIndex: "area",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
				},
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={[]}
						/>
					);
				},
			},
			{
				title: "项目群",
				dataIndex: "projectGroup",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
				},
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={[]}
						/>
					);
				},
			},
			{
				title: "项目名称",
				dataIndex: "projectName",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
				},
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={[]}
						/>
					);
				},
			},
			{
				title: "物业类型",
				dataIndex: "propertyType",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
				},
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={[]}
						/>
					);
				},
			},
			{
				title: "服务等级",
				dataIndex: "serviceLevel",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
				},
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={[]}
						/>
					);
				},
			},
			{
				title: "剩余预算(万元)",
				dataIndex: "remainingBudget",
				hideInSearch: true,
				sorter: true,
				render: (value: any) => {
					return (
						<Badge status={value > 0 ? "success" : "error"} text={value?.toFixed(2)} />
					);
				},
			},
			{
				title: "预算使用率",
				dataIndex: "budgetUsageRate",
				hideInSearch: true,
				sorter: true,
			},
			{
				title: "预算偏差率",
				dataIndex: "budgetDeviationRate",
				hideInSearch: true,
				sorter: true,
			},
			{
				title: "实际支出(万元)",
				dataIndex: "actualExpenditure",
				hideInSearch: true,
				render: (value: any) => {
					return value?.toFixed(2);
				},
			},
			{
				title: "月度预算(万元)",
				dataIndex: "monthlyBudget",
				hideInSearch: true,
				sorter: true,
				render: (value: any) => {
					return value?.toFixed(2);
				},
			},
		];
	};
	const getGroupColumns = () => {
		return [
			{
				title: "排名",
				dataIndex: "rank",
				hideInSearch: true,
			},
			{
				title: "区域",
				dataIndex: "region",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
				},
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={[]}
						/>
					);
				},
			},
			{
				title: "地区",
				dataIndex: "area",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
				},
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={[]}
						/>
					);
				},
			},
			{
				title: "项目群",
				dataIndex: "projectGroup",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
				},
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={[]}
						/>
					);
				},
			},
			{
				title: "项目名称",
				dataIndex: "projectName",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
				},
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={[]}
						/>
					);
				},
			},
			{
				title: "物业类型",
				width: 100,
				dataIndex: "propertyType",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
				},
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={[]}
						/>
					);
				},
			},
			{
				title: "服务等级",
				dataIndex: "serviceLevel",
				width: 90,
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
				},
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={[]}
						/>
					);
				},
			},
			{
				title: "工种",
				dataIndex: "serviceLevel",
				width: 90,
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
				},
				render: () => {
					return <span>项目管理</span>;
				},
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={[]}
						/>
					);
				},
			},
			{
				title: "剩余预算(万元)",
				dataIndex: "remainingBudget",
				hideInSearch: true,
				sorter: true,
				render: (value: any) => {
					return (
						<Badge status={value > 0 ? "success" : "error"} text={value?.toFixed(2)} />
					);
				},
			},
			{
				title: "预算使用率",
				dataIndex: "budgetUsageRate",
				hideInSearch: true,
				sorter: true,
			},
			{
				title: "预算偏差率",
				dataIndex: "budgetDeviationRate",
				hideInSearch: true,
				sorter: true,
			},
			{
				title: "超编人数(人)",
				width: 120,
				dataIndex: "overheadCount",
				hideInSearch: true,
				sorter: true,
				render: () => {
					return 7;
				},
			},
			{
				title: "单价偏差(万元)",
				width: 140,
				dataIndex: "overheadCount",
				hideInSearch: true,
				sorter: true,
				render: () => {
					return "-7.10";
				},
			},
			{
				title: "实际支出(万元)",
				dataIndex: "actualExpenditure",
				hideInSearch: true,
				sorter: true,
				render: (value: any) => {
					return value?.toFixed(2);
				},
			},
			{
				title: "月度预算(万元)",
				dataIndex: "monthlyBudget",
				hideInSearch: true,
				sorter: true,
				render: () => {
					return "100.00";
				},
			},
			{
				title: "平均薪酬(万元)",
				dataIndex: "monthlyBudget",
				hideInSearch: true,
				sorter: true,
				width: 140,
				render: () => {
					return 10.45;
				},
			},
			{
				title: "在职人数(人)",
				dataIndex: "monthlyBudget",
				hideInSearch: true,
				width: 120,
				sorter: true,
				render: () => {
					return 10;
				},
			},
			{
				title: "编制人数(人)",
				dataIndex: "monthlyBudget1",
				hideInSearch: true,
				width: 120,
				sorter: true,
				render: () => {
					return 8;
				},
			},

			{
				title: "实际单价(万元)",
				dataIndex: "monthlyBudget2",
				hideInSearch: true,
				width: 130,
				sorter: true,
				render: () => {
					return "10.45";
				},
			},
			{
				title: "标准单价(万元)",
				dataIndex: "monthlyBudget3",
				hideInSearch: true,
				sorter: true,
				width: 130,
				render: () => {
					return "8.36";
				},
			},
		];
	};
	const request = async (pramas: any) => {
		const { pageSize, current } = pramas;

		return {
			data: fakeData2,
			success: true,
			total: fakeData2.length,
			pageSize,
			pageNum: current,
		};
	};
	return (
		<Drawer
			closable={false}
			onClose={onClose}
			open={open}
			width="75%"
			height="100vh"
			size="large"
			title="X月项目成本排名"
			extra={
				<Button
					type="text"
					icon={<CloseOutlined />}
					onClick={onClose}
					className="text-gray-500 hover:text-gray-700"
				/>
			}
		>
			<div className="h-full w-full">
				<BasicTable
					cardProps={false}
					// rowKey="roleId"
					adaptive={{
						offsetBottom: 16,
					}}
					columns={structure === 4 ? getGroupColumns() : (getColumns() as any)}
					request={request as any}
					actionRef={actionRef}
					formRef={formRef}
					cardBordered={false}
					search={{
						className:
							"!mb-0 !pt-0 !px-0 [&_.ant-pro-query-filter_.ant-form-item-label>label]:!whitespace-nowrap ",
						labelWidth: "auto",
						span: { xs: 6, sm: 6, md: 6, lg: 6, xl: 6, xxl: 6 },
						defaultCollapsed: false,
						optionRender: (searchConfig) => [
							<Button
								key="submit"
								type="primary"
								onClick={() => searchConfig.form?.submit()}
							>
								查询
							</Button>,
							<Button
								key="reset"
								type="text"
								onClick={() => {
									searchConfig.form?.resetFields();
									searchConfig.form?.submit();
								}}
							>
								重置
							</Button>,
						],
					}}
					options={false}
				/>
			</div>
		</Drawer>
	);
}
