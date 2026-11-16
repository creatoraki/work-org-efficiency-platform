import redConfirm from "#src/assets/svg/red-confirm.svg";
import { Badge, DatePicker, Input, Select } from "antd";

function getColumns(openDetail: (record: any) => void) {
	return [
		{
			title: "预警编号",
			dataIndex: "warningId",
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
					<Input
						allowClear
						placeholder="支持模糊搜索"
						className="variant=borderless w-full"
					/>
				);
			},
			render: (value: any, record: any) => {
				return (
					<div
						title={value}
						className="cursor-pointer text-[#0075FF]"
						onClick={() => openDetail(record)}
					>
						{value}
					</div>
				);
			},
		},
		{
			title: "所属组织",
			dataIndex: "orgPath",
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
			title: "预警内容",
			dataIndex: "warningContent",
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
					<Input
						allowClear
						placeholder="支持模糊搜索"
						className="variant=borderless w-full"
					/>
				);
			},
		},
		{
			title: "最新预警等级",
			dataIndex: "level",
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
			render: (value: any, record: any) => {
				const levelCode = record.levelCode;
				return (
					<Badge
						color={
							levelCode === 2 ? "#FFD900" : levelCode === 3 ? "#FF7D00" : "#F5222D"
						}
						text={value}
					/>
				);
			},
		},
		{
			title: "首次预警时间",
			dataIndex: "firstWarningDate",
			hideInSearch: false,
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6] pl-4",
			},
			fieldProps: {
				variant: "borderless",
			},
			renderFormItem: () => {
				return <DatePicker.RangePicker />;
			},
		},
		{
			title: "消息状态",
			dataIndex: "status",
			hideInSearch: true,
			fieldProps: {
				variant: "borderless",
			},
			render: (value: any, _: any, index: number) => {
				return (
					<div className="flex items-center gap-1">
						{index === 0 ? (
							<img src={redConfirm} className="-ml-4 h-4 w-4" />
						) : (
							<div className="-ml-4 h-4 w-4"></div>
						)}
						<span> {value}</span>
					</div>
				);
			},
		},
	];
}

function getDetailColumns() {
	return [
		{
			title: "序号",
			dataIndex: "id",
			key: "id",
			width: 30,
		},
		{
			title: "催办接收人",
			dataIndex: "receiver",
			key: "receiver",
			width: 50,
		},
		{
			title: "催办时间",
			dataIndex: "remindTime",
			key: "remindTime",
			width: 60,
		},
		{
			title: "催办内容",
			dataIndex: "content",
			key: "content",
			width: 120,
		},
		{
			title: "催办人",
			dataIndex: "operator",
			key: "operator",
			width: 50,
		},
	];
}
export { getColumns, getDetailColumns };
