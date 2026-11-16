import { DatePicker, Input, Tooltip } from "antd";

function getColumns() {
	return [
		{
			title: "管控维度",
			dataIndex: "controlDimension",
			hideInSearch: true,
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
				return <Input placeholder="支持模糊搜索" className="variant=borderless w-full" />;
			},
		},
		{
			title: "预警建议",
			width: 900,
			dataIndex: "warningSuggestion",
			hideInSearch: true,
			render: (value: any) => {
				return (
					<Tooltip title={value} style={{ width: 90 }}>
						<div className="w-[800px] cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap">
							{value}
						</div>
					</Tooltip>
				);
			},
		},
		{
			title: "关联预警规则",
			dataIndex: "relatedRule",
			hideInSearch: false,
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6] pl-4",
			},
			fieldProps: {
				variant: "borderless",
			},
			renderFormItem: () => {
				return <Input placeholder="支持模糊搜索" className="variant=borderless w-full" />;
			},
		},
		{
			title: "创建时间",
			dataIndex: "createTime",
			hideInSearch: false,
			sorter: true,
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
	];
}

export { getColumns };
