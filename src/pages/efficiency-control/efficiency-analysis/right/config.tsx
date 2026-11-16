import allocateCost from "#src/assets/svg/allocate-costs.svg";
import orgEmployee from "#src/assets/svg/org-employee.svg";
import reserveCost from "#src/assets/svg/reserve-cost.svg";
import variableCost from "#src/assets/svg/variable-cost.svg";
import { addThousand } from "#src/utils/add-thousand";
import { Badge } from "antd";
import * as echarts from "echarts";
import { jobColor } from "../middle/config";

const NormalClassName = "text-10 md:text-xs  whitespace-nowrap";

const gaugeOtion = {
	type: "gauge",
	center: ["55%", "85%"],
	radius: "120%",
	startAngle: 180,
	endAngle: 0,
	min: 0,
	max: 100,
	splitNumber: 4,
	itemStyle: {
		color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
			{ offset: 0, color: "#0075FF" },
			{ offset: 1, color: "#26CFFF" },
		]),
	},
	progress: {
		show: true,
		width: 14,
	},
	pointer: {
		show: false,
	},
	axisLine: {
		lineStyle: {
			width: 14,
			color: [[1, "#EBEEF5"]],
		},
	},
	axisTick: {
		show: false,
	},
	splitLine: {
		show: false,
	},
	axisLabel: {
		rotate: "tangential",
		distance: -30,
		color: "#909399",
		fontSize: 12,
	},
	title: {
		show: false,
	},
	detail: {
		width: "100%",
		lineHeight: 40,
		height: 40,
		valueAnimation: true,
		formatter(value: any) {
			return `{value|${value}}`;
		},
		rich: {
			null: {
				fontSize: 14,
				fontWeight: 400,
				color: "#606266",
				fontFamily: "var(--ant-5-font-family)",
				opacity: 0.8,
			},
			value: {
				fontSize: 22,
				fontWeight: 500,
				color: "#000000",
				fontFamily: "var(--ant-5-font-family)",
			},
			target: {
				fontSize: 14,
				color: "#606266",
			},
		},
	},
};

function getColumns(tableSorter: any, onClick: (record: any) => void): any[] {
	return [
		{
			title: <span className={NormalClassName}>排名</span>,
			key: "rank",
			dataIndex: "rank",
			width: 60,
			// fixed: "left",
			render: (value: number) => {
				return <span className={NormalClassName}>{value}</span>;
			},
		},

		{
			title: <span className={NormalClassName}>组织名称</span>,
			// title: <span className={NormalClassName}>地区</span>,

			key: "area",
			// fixed: "left",
			dataIndex: "area",
			width: 100,
			render: (value: any, record: any) => {
				return (
					<div
						title={value}
						className={`cursor-pointer text-[#0075FF] ${NormalClassName}`}
						onClick={() => onClick(record)}
					>
						{value}
					</div>
				);
			},
		},

		{
			title: <span className={NormalClassName}>剩余预算(万元)</span>,

			dataIndex: "remainingBudget",
			key: "remainingBudget",
			width: 130,
			sorter: true,
			sortOrder: tableSorter?.field === "remainingBudget" ? tableSorter.order : null,
			defaultSortOrder: "descend",
			render: (value: number) => {
				const number = Number(value);
				// console.log(record);
				return (
					<span
						className={`md h-auto w-auto rounded-xl px-2 py-1 ${NormalClassName}`}
						style={{
							backgroundColor: number > 0 ? "#E3F7ED" : "#FEE4E6",
							color: number > 0 ? "#14B968" : "#F5222D",
						}}
					>
						{addThousand(number.toFixed(2))}
					</span>
				);
			},
		},
		{
			title: <span className={NormalClassName}>达标率</span>,

			dataIndex: "passRate",
			key: "passRate",
			width: 90,
			sorter: true,
			sortOrder: tableSorter?.field === "passRate" ? tableSorter.order : null,
			// render: (value: any) => {
			// 	return addThousandsSeparator(value);
			// },
			render: (value: number) => {
				return <span className={NormalClassName}>{value}</span>;
			},
		},

		{
			title: <span className={NormalClassName}>达标项目数</span>,

			dataIndex: "passedProjects",
			key: "passedProjects",
			width: 120,
			sorter: true,
			sortOrder: tableSorter?.field === "passedProjects" ? tableSorter.order : null,
			render: (value: any) => {
				return <span className={NormalClassName}>{value.toFixed(2)}</span>;
			},
		},
		{
			title: <span className={NormalClassName}>不达标项目数</span>,

			dataIndex: "failedProjects",
			key: "failedProjects",
			width: 120,
			sorter: true,
			sortOrder: tableSorter?.field === "failedProjects" ? tableSorter.order : null,
			render: (value: any) => {
				return <span className={NormalClassName}>{value.toFixed(2)}</span>;
			},
		},
		{
			title: <span className={NormalClassName}>预算使用率(%)</span>,

			dataIndex: "budgetUsageRate",
			key: "budgetUsageRate",
			width: 120,
			sorter: true,
			sortOrder: tableSorter?.field === "budgetUsageRate" ? tableSorter.order : null,
			render: () => {
				return <span className={NormalClassName}>100.00</span>;
			},
		},
		{
			title: <span className={NormalClassName}>预算偏差率(%)</span>,

			dataIndex: "budgetDeviationRate",
			key: "budgetDeviationRate",
			width: 120,
			sorter: true,
			sortOrder: tableSorter?.field === "budgetDeviationRate" ? tableSorter.order : null,
			render: () => {
				return <span className={NormalClassName}>100.00</span>;
			},
		},
		{
			title: <span className={NormalClassName}>实际支出(万元)</span>,

			dataIndex: "actualExpenditure",
			key: "actualExpenditure",
			width: 120,
			sorter: true,
			sortOrder: tableSorter?.field === "actualExpenditure" ? tableSorter.order : null,
			render: () => {
				return <span className={NormalClassName}>100.00</span>;
			},
		},
		{
			title: <span className={NormalClassName}>月度预算(万元)</span>,

			dataIndex: "monthlyBudget",
			key: "monthlyBudget",
			width: 120,
			sorter: true,
			sortOrder: tableSorter?.field === "monthlyBudget" ? tableSorter.order : null,
			render: () => {
				return <span className={NormalClassName}>100.00</span>;
			},
		},
	];
}

function getGroupColumns(tableSorter: any, onClick: (record: any) => void): any[] {
	return [
		{
			title: <span className={NormalClassName}>排名</span>,
			key: "rank",
			dataIndex: "rank",
			width: 60,
			render: (value: number) => {
				return <span className={NormalClassName}>{value}</span>;
			},
		},

		{
			title: <span className={NormalClassName}>组织名称</span>,
			// title: <span className={NormalClassName}>地区</span>,

			key: "area",
			// fixed: "left",
			dataIndex: "area",
			width: 250,
			render: (value: any, record: any) => {
				return (
					<div
						title={value}
						className={`cursor-pointer text-[#0075FF] ${NormalClassName}`}
						onClick={() => onClick(record)}
					>
						{value}
					</div>
				);
			},
		},
		{
			title: <span className={NormalClassName}>物业类型</span>,
			key: "propertyType",
			dataIndex: "propertyType",
			width: 100,
			render: () => {
				return <span className={NormalClassName}>住宅类-高层</span>;
			},
		},
		{
			title: <span className={NormalClassName}>服务等级</span>,
			key: "serviceLevel",
			dataIndex: "serviceLevel",
			width: 90,
			render: () => {
				return <span className={NormalClassName}>精品</span>;
			},
		},
		{
			title: <span className={NormalClassName}>剩余预算(万元)</span>,

			dataIndex: "remainingBudget",
			key: "remainingBudget",
			width: 130,
			sorter: true,
			sortOrder: tableSorter?.field === "remainingBudget" ? tableSorter.order : null,
			defaultSortOrder: "descend",
			render: (value: number) => {
				const number = Number(value);
				// console.log(record);
				return (
					<span
						className={`md h-auto w-auto rounded-xl px-2 py-1 ${NormalClassName}`}
						style={{
							backgroundColor: number > 0 ? "#E3F7ED" : "#FEE4E6",
							color: number > 0 ? "#14B968" : "#F5222D",
						}}
					>
						{addThousand(number.toFixed(2))}
					</span>
				);
			},
		},
		{
			title: <span className={NormalClassName}>预算使用率(%)</span>,

			dataIndex: "budgetUsageRate",
			key: "budgetUsageRate",
			width: 120,
			sorter: true,
			sortOrder: tableSorter?.field === "budgetUsageRate" ? tableSorter.order : null,
			render: () => {
				return <span className={NormalClassName}>100.00</span>;
			},
		},
		{
			title: <span className={NormalClassName}>预算偏差率(%)</span>,

			dataIndex: "budgetDeviationRate",
			key: "budgetDeviationRate",
			width: 120,
			sorter: true,
			sortOrder: tableSorter?.field === "budgetDeviationRate" ? tableSorter.order : null,
			render: () => {
				return <span className={NormalClassName}>100.00</span>;
			},
		},
		{
			title: <span className={NormalClassName}>实际支出(万元)</span>,

			dataIndex: "actualExpenditure",
			key: "actualExpenditure",
			width: 120,
			sorter: true,
			sortOrder: tableSorter?.field === "actualExpenditure" ? tableSorter.order : null,
			render: () => {
				return <span className={NormalClassName}>100.00</span>;
			},
		},
		{
			title: <span className={NormalClassName}>月度预算(万元)</span>,

			dataIndex: "monthlyBudget",
			key: "monthlyBudget",
			width: 120,
			sorter: true,
			sortOrder: tableSorter?.field === "monthlyBudget" ? tableSorter.order : null,
			render: () => {
				return <span className={NormalClassName}>100.00</span>;
			},
		},
	];
}
const fakeData = [
	{
		rank: "总",
		region: "",
		area: "绿城服务集团",
		remainingBudget: 564.02,
		passRate: "78.56%",
		passedProjects: 121,
		failedProjects: 76,
	},
	{
		rank: 1,
		region: "杭州区域公司",
		area: "环杭地区",
		remainingBudget: 40.0,
		passRate: "90.43%",
		passedProjects: 41,
		failedProjects: 2,
	},
	{
		rank: 2,
		region: "杭州区域公司",
		area: "杭西地区",
		remainingBudget: -10.0,
		passRate: "52.57%",
		passedProjects: 82,
		failedProjects: 44,
	},
	{
		rank: 3,
		region: "浙东区域公司",
		area: "宁波地区",
		remainingBudget: 20.0,
		passRate: "96.63%",
		passedProjects: 36,
		failedProjects: 1,
	},
	{
		rank: 4,
		region: "浙北区域公司",
		area: "浙北地区",
		remainingBudget: 20.0,
		passRate: "52.57%",
		passedProjects: 41,
		failedProjects: 20,
	},
	{
		rank: 5,
		region: "浙南区域公司",
		area: "浙南地区",
		remainingBudget: 40.0,
		passRate: "54.57%",
		passedProjects: 55,
		failedProjects: 55,
	},
	{
		rank: 6,
		region: "江苏区域公司",
		area: "江苏地区",
		remainingBudget: 10.63,
		passRate: "44.00%",
		passedProjects: 26,
		failedProjects: 26,
	},
	{
		rank: 7,
		region: "山东区域公司",
		area: "山东地区",
		remainingBudget: 30.63,
		passRate: "96.63%",
		passedProjects: 71,
		failedProjects: 4,
	},
	{
		rank: 8,
		region: "北方区域公司",
		area: "北方地区",
		remainingBudget: 10.63,
		passRate: "96.63%",
		passedProjects: 68,
		failedProjects: 9,
	},
	{
		rank: 9,
		region: "华中区域公司",
		area: "华中地区",
		remainingBudget: -40.0,
		passRate: "59.58%",
		passedProjects: 59,
		failedProjects: 1,
	},
	{
		rank: 10,
		region: "华南区域公司",
		area: "华南地区",
		remainingBudget: 30.0,
		passRate: "85.00%",
		passedProjects: 51,
		failedProjects: 9,
	},
];
const fakeGroupData = [
	{
		rank: "总",
		region: "",
		area: "定海项目群",
		remainingBudget: 564.02,
		passRate: "78.56%",
		passedProjects: 121,
		failedProjects: 76,
	},
	{
		rank: 1,
		region: "杭州区域公司",
		area: "杭州风雅钱塘世纪花园生活服务中心",
		remainingBudget: 40.0,
		passRate: "90.43%",
		passedProjects: 41,
		failedProjects: 2,
	},
	{
		rank: 2,
		region: "杭州区域公司",
		area: "杭州六合天寓生活服务中心",
		remainingBudget: -10.0,
		passRate: "52.57%",
		passedProjects: 82,
		failedProjects: 44,
	},
	{
		rank: 3,
		region: "浙东区域公司",
		area: "杭州悦晟国际金融大厦服务中心",
		remainingBudget: 20.0,
		passRate: "96.63%",
		passedProjects: 36,
		failedProjects: 1,
	},
	{
		rank: 4,
		region: "浙北区域公司",
		area: "杭州钱塘玫瑰湾生活服务中心",
		remainingBudget: 20.0,
		passRate: "52.57%",
		passedProjects: 41,
		failedProjects: 20,
	},
	{
		rank: 5,
		region: "浙南区域公司",
		area: "浙南地区",
		remainingBudget: 40.0,
		passRate: "54.57%",
		passedProjects: 55,
		failedProjects: 55,
	},
	{
		rank: 6,
		region: "江苏区域公司",
		area: "浙江杭州春江时代花园生活服务中心",
		remainingBudget: 10.63,
		passRate: "44.00%",
		passedProjects: 26,
		failedProjects: 26,
	},
	{
		rank: 7,
		region: "山东区域公司",
		area: "浙江杭州倾城之恋花园生活服务中心",
		remainingBudget: 30.63,
		passRate: "96.63%",
		passedProjects: 71,
		failedProjects: 4,
	},
	{
		rank: 8,
		region: "北方区域公司",
		area: "浙江杭州白金海岸小区生活服务中心",
		remainingBudget: 10.63,
		passRate: "96.63%",
		passedProjects: 68,
		failedProjects: 9,
	},
	{
		rank: 9,
		region: "华中区域公司",
		area: "杭州中月创智大厦客户服务中心",
		remainingBudget: -40.0,
		passRate: "59.58%",
		passedProjects: 59,
		failedProjects: 1,
	},
	{
		rank: 10,
		region: "华南区域公司",
		area: "杭州春江花月服务中心",
		remainingBudget: 30.0,
		passRate: "85.00%",
		passedProjects: 51,
		failedProjects: 9,
	},
];
const fakeData2 = [
	{
		rank: 1,
		region: "杭州区域公司",
		area: "杭东地区",
		projectGroup: "滨江项目群",
		projectName: "杭州巧园公寓服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: -25.0,
		budgetUsageRate: "115.00%",
		budgetDeviationRate: "25.00%",
		actualExpenditure: 125.0,
		monthlyBudget: 100.0,
	},
	{
		rank: 2,
		region: "杭州区域公司",
		area: "环杭地区",
		projectGroup: "滨江项目群",
		projectName: "杭州贝雅钱塘世纪花园生活服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: 40.0,
		budgetUsageRate: "27.00%",
		budgetDeviationRate: "7.00%",
		actualExpenditure: 57.0,
		monthlyBudget: 97.0,
	},
	{
		rank: 3,
		region: "杭州区域公司",
		area: "杭西地区",
		projectGroup: "凤舞项目群",
		projectName: "杭州六合天寓生活服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: -10.0,
		budgetUsageRate: "29.00%",
		budgetDeviationRate: "9.00%",
		actualExpenditure: 69.0,
		monthlyBudget: 59.0,
	},
	{
		rank: 4,
		region: "浙东区域公司",
		area: "宁波地区",
		projectGroup: "风雅项目群",
		projectName: "杭州悦景国际金融大厦服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: 20.0,
		budgetUsageRate: "72.00%",
		budgetDeviationRate: "2.00%",
		actualExpenditure: 62.0,
		monthlyBudget: 82.0,
	},
	{
		rank: 5,
		region: "浙北区域公司",
		area: "浙北地区",
		projectGroup: "风雅项目群",
		projectName: "杭州钱塘玫瑰湾生活服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: 20.0,
		budgetUsageRate: "53.00%",
		budgetDeviationRate: "3.00%",
		actualExpenditure: 36.0,
		monthlyBudget: 56.0,
	},
	{
		rank: 6,
		region: "浙南区域公司",
		area: "浙南地区",
		projectGroup: "柳岸项目群",
		projectName: "浙江杭州香江时代花园生活服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: 40.0,
		budgetUsageRate: "97.00%",
		budgetDeviationRate: "9.00%",
		actualExpenditure: 29.0,
		monthlyBudget: 69.0,
	},
	{
		rank: 7,
		region: "江苏区域公司",
		area: "江苏地区",
		projectGroup: "电力项目群",
		projectName: "浙江杭州锦城之恋花园生活服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: 10.0,
		budgetUsageRate: "100.00%",
		budgetDeviationRate: "10.00%",
		actualExpenditure: 90.0,
		monthlyBudget: 100.0,
	},
	{
		rank: 8,
		region: "山东区域公司",
		area: "山东地区",
		projectGroup: "钱江新城项目群",
		projectName: "浙江杭州白金海岸小区生活服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: 30.0,
		budgetUsageRate: "42.00%",
		budgetDeviationRate: "4.00%",
		actualExpenditure: 54.0,
		monthlyBudget: 84.0,
	},
	{
		rank: 9,
		region: "北方区域公司",
		area: "北方地区",
		projectGroup: "杭东商业项目群",
		projectName: "杭州中月创智大厦客户服务中",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: 10.0,
		budgetUsageRate: "27.00%",
		budgetDeviationRate: "7.00%",
		actualExpenditure: 87.0,
		monthlyBudget: 97.0,
	},
	{
		rank: 10,
		region: "华中区域公司",
		area: "华中地区",
		projectGroup: "春江项目群",
		projectName: "杭州春江花月服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: -40.0,
		budgetUsageRate: "29.00%",
		budgetDeviationRate: "9.00%",
		actualExpenditure: 99.0,
		monthlyBudget: 59.0,
	},
	{
		rank: 11,
		region: "华南区域公司",
		area: "华南地区",
		projectGroup: "杨柳项目群",
		projectName: "杭州绿缘园服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: 30.0,
		budgetUsageRate: "72.00%",
		budgetDeviationRate: "7.00%",
		actualExpenditure: 57.0,
		monthlyBudget: 87.0,
	},
	{
		rank: 12,
		region: "华西区域公司",
		area: "华西地区",
		projectGroup: "九堡项目群",
		projectName: "杭州丽园服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: 20.0,
		budgetUsageRate: "53.00%",
		budgetDeviationRate: "3.00%",
		actualExpenditure: 63.0,
		monthlyBudget: 83.0,
	},
	{
		rank: 13,
		region: "上海区域公司",
		area: "上海地区",
		projectGroup: "蓝钱项目群",
		projectName: "杭州望江府服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: 0.0,
		budgetUsageRate: "97.00%",
		budgetDeviationRate: "7.00%",
		actualExpenditure: 87.0,
		monthlyBudget: 87.0,
	},
	{
		rank: 14,
		region: "上海区域公司",
		area: "上海地区",
		projectGroup: "钱塘项目群",
		projectName: "浙江杭州钱江荣耀府生活服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: 10.0,
		budgetUsageRate: "29.00%",
		budgetDeviationRate: "9.00%",
		actualExpenditure: 91.0,
		monthlyBudget: 101.0,
	},
	{
		rank: 15,
		region: "上海区域公司",
		area: "上海地区",
		projectGroup: "柳岸项目群",
		projectName: "杭州蔚蓝公寓生活服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: 40.0,
		budgetUsageRate: "97.00%",
		budgetDeviationRate: "9.00%",
		actualExpenditure: 59.0,
		monthlyBudget: 89.0,
	},
	{
		rank: 16,
		region: "上海区域公司",
		area: "上海地区",
		projectGroup: "电力项目群",
		projectName: "绿城金隅生活服务中心",
		propertyType: "住宅类-别墅",
		serviceLevel: "精品",
		remainingBudget: 0.0,
		budgetUsageRate: "100.00%",
		budgetDeviationRate: "20.00%",
		actualExpenditure: 20.0,
		monthlyBudget: 20.0,
	},
	{
		rank: 17,
		region: "上海区域公司",
		area: "上海地区",
		projectGroup: "钱江新城项目群",
		projectName: "绿城世茂维拉生活服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: -20.0,
		budgetUsageRate: "72.00%",
		budgetDeviationRate: "2.00%",
		actualExpenditure: 62.0,
		monthlyBudget: 42.0,
	},
	{
		rank: 18,
		region: "上海区域公司",
		area: "上海地区",
		projectGroup: "杭东商业项目群",
		projectName: "绿城礼豪大卫星生活服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: 40.0,
		budgetUsageRate: "53.00%",
		budgetDeviationRate: "3.00%",
		actualExpenditure: 83.0,
		monthlyBudget: 93.0,
	},
	{
		rank: 19,
		region: "上海区域公司",
		area: "上海地区",
		projectGroup: "春江项目群",
		projectName: "绿城东西祥云生活服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: 40.0,
		budgetUsageRate: "97.00%",
		budgetDeviationRate: "7.00%",
		actualExpenditure: 75.0,
		monthlyBudget: 85.0,
	},
	{
		rank: 20,
		region: "上海区域公司",
		area: "上海地区",
		projectGroup: "杨柳项目群",
		projectName: "绿城山庄生活服务中心",
		propertyType: "住宅类-高层",
		serviceLevel: "精品",
		remainingBudget: 40.0,
		budgetUsageRate: "53.00%",
		budgetDeviationRate: "3.00%",
		actualExpenditure: 39.0,
		monthlyBudget: 59.0,
	},
];

const SalaryDetailfakeData: any[] = [
	{
		rank: 1,
		jobType: "项目管理",
		remainingBudget: -25.0,
		budgetUsageRate: "115.00%",
		budgetDeviationRate: "25.00%",
		overstaffCount: 2,
		unitCostDeviation: 5.0,
		actualExpenditure: 125.0,
		monthlyBudget: 100.0,
		averageSalary: 10.45,
		currentEmployed: 8,
		staffing: 8,
		actualUnitPrice: 10.45,
		standardUnitPrice: 10.45,
	},
	{
		rank: 2,
		jobType: "项目管理",
		remainingBudget: 40.0,
		budgetUsageRate: "27.00%",
		budgetDeviationRate: "7.00%",
		overstaffCount: 7,
		unitCostDeviation: -7.1,
		actualExpenditure: 57.1,
		monthlyBudget: 97.1,
		averageSalary: 8.36,
		currentEmployed: 12,
		staffing: 12,
		actualUnitPrice: 8.36,
		standardUnitPrice: 8.36,
	},
	{
		rank: 3,
		jobType: "项目管理",
		remainingBudget: -10.0,
		budgetUsageRate: "29.00%",
		budgetDeviationRate: "9.00%",
		overstaffCount: 9,
		unitCostDeviation: 9.0,
		actualExpenditure: 69.0,
		monthlyBudget: 59.0,
		averageSalary: 9.51,
		currentEmployed: 6,
		staffing: 6,
		actualUnitPrice: 9.51,
		standardUnitPrice: 9.51,
	},
	{
		rank: 4,
		jobType: "项目管理",
		remainingBudget: 20.0,
		budgetUsageRate: "72.00%",
		budgetDeviationRate: "2.00%",
		overstaffCount: 2,
		unitCostDeviation: -2.0,
		actualExpenditure: 62.0,
		monthlyBudget: 82.0,
		averageSalary: 7.59,
		currentEmployed: 12,
		staffing: 12,
		actualUnitPrice: 7.59,
		standardUnitPrice: 7.59,
	},
	{
		rank: 5,
		jobType: "项目管理",
		remainingBudget: 20.0,
		budgetUsageRate: "53.00%",
		budgetDeviationRate: "3.00%",
		overstaffCount: 3,
		unitCostDeviation: 6.0,
		actualExpenditure: 36.0,
		monthlyBudget: 56.0,
		averageSalary: 6.45,
		currentEmployed: 15,
		staffing: 15,
		actualUnitPrice: 6.45,
		standardUnitPrice: 6.45,
	},
	{
		rank: 6,
		jobType: "项目管理",
		remainingBudget: 40.0,
		budgetUsageRate: "97.00%",
		budgetDeviationRate: "9.00%",
		overstaffCount: 9,
		unitCostDeviation: -9.0,
		actualExpenditure: 29.0,
		monthlyBudget: 69.0,
		averageSalary: 620.45,
		currentEmployed: 14,
		staffing: 14,
		actualUnitPrice: 620.45,
		standardUnitPrice: 620.45,
	},
	{
		rank: 7,
		jobType: "项目管理",
		remainingBudget: 10.0,
		budgetUsageRate: "100.00%",
		budgetDeviationRate: "10.00%",
		overstaffCount: 10,
		unitCostDeviation: 8.0,
		actualExpenditure: 90.0,
		monthlyBudget: 100.0,
		averageSalary: 920.36,
		currentEmployed: 23,
		staffing: 23,
		actualUnitPrice: 920.36,
		standardUnitPrice: 920.36,
	},
	{
		rank: 8,
		jobType: "项目管理",
		remainingBudget: 30.0,
		budgetUsageRate: "42.00%",
		budgetDeviationRate: "4.00%",
		overstaffCount: 4,
		unitCostDeviation: 4.0,
		actualExpenditure: 54.0,
		monthlyBudget: 84.0,
		averageSalary: 16.51,
		currentEmployed: 4,
		staffing: 4,
		actualUnitPrice: 16.51,
		standardUnitPrice: 16.51,
	},
	{
		rank: 9,
		jobType: "项目管理",
		remainingBudget: 10.0,
		budgetUsageRate: "27.00%",
		budgetDeviationRate: "7.00%",
		overstaffCount: 7,
		unitCostDeviation: 8.0,
		actualExpenditure: 87.0,
		monthlyBudget: 97.0,
		averageSalary: 12.59,
		currentEmployed: 8,
		staffing: 8,
		actualUnitPrice: 12.59,
		standardUnitPrice: 12.59,
	},
	{
		rank: 10,
		jobType: "管家",
		remainingBudget: -40.0,
		budgetUsageRate: "29.00%",
		budgetDeviationRate: "9.00%",
		overstaffCount: 9,
		unitCostDeviation: 5.0,
		actualExpenditure: 99.0,
		monthlyBudget: 59.0,
		averageSalary: 10.45,
		currentEmployed: 9,
		staffing: 9,
		actualUnitPrice: 10.45,
		standardUnitPrice: 10.45,
	},
	{
		rank: 11,
		jobType: "管家",
		remainingBudget: 30.0,
		budgetUsageRate: "72.00%",
		budgetDeviationRate: "7.00%",
		overstaffCount: 7,
		unitCostDeviation: 9.0,
		actualExpenditure: 57.0,
		monthlyBudget: 87.0,
		averageSalary: 8.36,
		currentEmployed: 16,
		staffing: 16,
		actualUnitPrice: 8.36,
		standardUnitPrice: 8.36,
	},
	{
		rank: 12,
		jobType: "管家",
		remainingBudget: 20.0,
		budgetUsageRate: "53.00%",
		budgetDeviationRate: "3.00%",
		overstaffCount: 3,
		unitCostDeviation: 3.0,
		actualExpenditure: 63.0,
		monthlyBudget: 83.0,
		averageSalary: 9.51,
		currentEmployed: 3,
		staffing: 3,
		actualUnitPrice: 9.51,
		standardUnitPrice: 9.51,
	},
	{
		rank: 13,
		jobType: "管家",
		remainingBudget: 0.0,
		budgetUsageRate: "97.00%",
		budgetDeviationRate: "7.00%",
		overstaffCount: 7,
		unitCostDeviation: 8.0,
		actualExpenditure: 87.0,
		monthlyBudget: 87.0,
		averageSalary: 7.59,
		currentEmployed: 24,
		staffing: 24,
		actualUnitPrice: 7.59,
		standardUnitPrice: 7.59,
	},
	{
		rank: 14,
		jobType: "管家",
		remainingBudget: 10.0,
		budgetUsageRate: "29.00%",
		budgetDeviationRate: "9.00%",
		overstaffCount: 9,
		unitCostDeviation: 1.0,
		actualExpenditure: 91.0,
		monthlyBudget: 101.0,
		averageSalary: 6.45,
		currentEmployed: 10,
		staffing: 10,
		actualUnitPrice: 6.45,
		standardUnitPrice: 6.45,
	},
	{
		rank: 15,
		jobType: "管家",
		remainingBudget: 40.0,
		budgetUsageRate: "97.00%",
		budgetDeviationRate: "9.00%",
		overstaffCount: 9,
		unitCostDeviation: 9.0,
		actualExpenditure: 59.0,
		monthlyBudget: 89.0,
		averageSalary: 620.45,
		currentEmployed: 9,
		staffing: 9,
		actualUnitPrice: 620.45,
		standardUnitPrice: 620.45,
	},
	{
		rank: 16,
		jobType: "管家",
		remainingBudget: 0.0,
		budgetUsageRate: "100.00%",
		budgetDeviationRate: "20.00%",
		overstaffCount: 20,
		unitCostDeviation: 5.0,
		actualExpenditure: 20.0,
		monthlyBudget: 20.0,
		averageSalary: 920.36,
		currentEmployed: 20,
		staffing: 20,
		actualUnitPrice: 920.36,
		standardUnitPrice: 920.36,
	},
	{
		rank: 17,
		jobType: "管家",
		remainingBudget: -20.0,
		budgetUsageRate: "72.00%",
		budgetDeviationRate: "2.00%",
		overstaffCount: 2,
		unitCostDeviation: 6.0,
		actualExpenditure: 62.0,
		monthlyBudget: 42.0,
		averageSalary: 16.51,
		currentEmployed: 2,
		staffing: 2,
		actualUnitPrice: 16.51,
		standardUnitPrice: 16.51,
	},
	{
		rank: 18,
		jobType: "管家",
		remainingBudget: 40.0,
		budgetUsageRate: "53.00%",
		budgetDeviationRate: "3.00%",
		overstaffCount: 3,
		unitCostDeviation: 3.0,
		actualExpenditure: 83.0,
		monthlyBudget: 93.0,
		averageSalary: 12.59,
		currentEmployed: 3,
		staffing: 3,
		actualUnitPrice: 12.59,
		standardUnitPrice: 12.59,
	},
	{
		rank: 19,
		jobType: "管家",
		remainingBudget: 40.0,
		budgetUsageRate: "97.00%",
		budgetDeviationRate: "7.00%",
		overstaffCount: 7,
		unitCostDeviation: 5.0,
		actualExpenditure: 75.0,
		monthlyBudget: 85.0,
		averageSalary: 16.51,
		currentEmployed: 7,
		staffing: 7,
		actualUnitPrice: 16.51,
		standardUnitPrice: 16.51,
	},
	{
		rank: 20,
		jobType: "管家",
		remainingBudget: 40.0,
		budgetUsageRate: "53.00%",
		budgetDeviationRate: "3.00%",
		overstaffCount: 3,
		unitCostDeviation: 9.0,
		actualExpenditure: 39.0,
		monthlyBudget: 59.0,
		averageSalary: 12.59,
		currentEmployed: 3,
		staffing: 3,
		actualUnitPrice: 12.59,
		standardUnitPrice: 12.59,
	},
];

const costsExpectedCompareFakeData: any[] = [
	{
		jobType: "项目管理",
		actualExpenditure: 145.02,
		remainingBudget: 60.43,
		averageSalary: 10.52,
		status: 1569, // 表示剩余预算为正，绿色显示
	},
	{
		jobType: "管家",
		actualExpenditure: 60.58,
		remainingBudget: -14.54,
		averageSalary: 6.56,
		status: 10000, // 表示剩余预算为负，红色显示
	},
];
const costsCompareFakeData: any[] = [
	{
		category: "月度预算(万元)",
		monthlyBudget: -9360.0,
		actualExpenditure: -8360.0,
		remainingBudget: -1000.0,
		status: -9360,
	},
	{
		category: "实际支出(万元)",
		monthlyBudget: 9360.0,
		actualExpenditure: 10360.0,
		remainingBudget: -1000.0,
		status: 8360,
	},
	{
		category: "剩余预算(万元)",
		monthlyBudget: 9360.0,
		actualExpenditure: 8360.0,
		remainingBudget: 1000.0,
		status: 1000,
	},
];
function getSalaryDetailColumns() {
	return [
		{
			title: "排名",
			dataIndex: "rank",
			hideInSearch: true,
		},
		{
			title: "工种",
			dataIndex: "jobType",
			hideInSearch: true,
		},
		{
			title: "剩余预算(万元)",
			dataIndex: "remainingBudget",
			hideInSearch: true,
			sorter: true,
			render: (value: any) => {
				return (
					<Badge
						status={value > 0 ? "success" : "error"}
						text={addThousand(value?.toFixed(2))}
					/>
				);
			},
		},
		{
			title: "预算使用率",
			dataIndex: "budgetUsageRate",
			hideInSearch: true,
		},
		{
			title: "预算偏差率",
			dataIndex: "budgetDeviationRate",
			hideInSearch: true,
			sorter: true,
		},
		{
			title: "超编人数(人)",
			dataIndex: "overstaffCount",
			hideInSearch: true,
			sorter: true,
		},

		{
			title: "单价偏差(万元)",
			dataIndex: "unitCostDeviation",
			hideInSearch: true,
		},
		{
			title: "实际支出(万元)",
			dataIndex: "actualExpenditure",
			hideInSearch: true,
			sorter: true,
		},
		{
			title: "月度预算(万元)",
			dataIndex: "monthlyBudget",
			hideInSearch: true,
			sorter: true,
		},

		{
			title: "平均薪酬(万元)",
			dataIndex: "averageSalary",
			hideInSearch: true,
		},
		{
			title: "在职人数(人)",
			dataIndex: "currentEmployed",
			hideInSearch: true,
			sorter: true,
		},
		{
			title: "编制人数(人)",
			dataIndex: "staffing",
			hideInSearch: true,
			sorter: true,
		},
		{
			title: "实际单价(万元)",
			dataIndex: "actualUnitPrice",
			hideInSearch: true,
			sorter: true,
		},
		{
			title: "标准单价(万元)",
			dataIndex: "standardUnitPrice",
			hideInSearch: true,
			sorter: true,
		},
	];
}

function getCostsCompareColumns() {
	return [
		{
			title: " ",
			key: "category",
			dataIndex: "category",
			width: 130,
			fixed: "left",
			render: (value: string, _: any, index: number) => {
				return (
					<div className="flex items-center justify-start text-[#000000]">
						<span
							className="mr-1 flex h-3 w-0.5 items-center justify-center"
							style={{
								backgroundColor:
									index === 1 ? "#0075FF" : index === 2 ? "#F5222D" : "#A174F6",
							}}
						></span>
						<span className={NormalClassName}>{value}</span>
					</div>
				);
			},
		},
		{
			title: (
				<div
					className={`flex items-center justify-start whitespace-nowrap text-[#14B968] ${NormalClassName}`}
				>
					<img src={orgEmployee} className="mr-1" />
					<span className={NormalClassName}>员工薪酬</span>
				</div>
			),
			dataIndex: "monthlyBudget",
			key: "monthlyBudget",
			fixed: "left",
			render: (value: number) => {
				return (
					<span
						className={`text-[${value > 0 ? "#606266" : "#F5222D"}] ${NormalClassName}`}
					>
						{addThousand(value.toFixed(2))}
					</span>
				);
			},
		},
		{
			title: (
				<div
					className={`flex items-center justify-start text-[#14B968] ${NormalClassName}`}
				>
					<img src={allocateCost} className="mr-1" />
					<span className={NormalClassName}>分摊成本</span>
				</div>
			),
			dataIndex: "actualExpenditure",
			key: "actualExpenditure",
			fixed: "left",
			render: (value: number) => {
				return (
					<span
						className={`text-[${value > 0 ? "#606266" : "#F5222D"}] ${NormalClassName}`}
					>
						{addThousand(value.toFixed(2))}
					</span>
				);
			},
		},
		{
			title: (
				<div
					className={`flex items-center justify-start text-[#A174F6] ${NormalClassName}`}
				>
					<img src={variableCost} className="mr-1" />
					<span className={NormalClassName}>可变成本</span>
				</div>
			),
			dataIndex: "remainingBudget",
			key: "remainingBudget",
			fixed: "left",
			render: (value: number) => {
				return (
					<span
						className={`text-[${value > 0 ? "#606266" : "#F5222D"}] ${NormalClassName}`}
					>
						{addThousand(value.toFixed(2))}
					</span>
				);
			},
		},
		{
			title: (
				<div
					className={`flex items-center justify-start text-[#A174F6] ${NormalClassName}`}
				>
					<img src={reserveCost} className="mr-1" />
					<span className={NormalClassName}>储备成本</span>
				</div>
			),
			dataIndex: "status",
			key: "status",
			fixed: "left",
			render: (value: number) => {
				return (
					<span
						className={`text-[${value > 0 ? "#606266" : "#F5222D"}] ${NormalClassName}`}
					>
						{addThousand(value.toFixed(2))}
					</span>
				);
			},
		},
	];
}
function getCostsExpectedCompareColumns() {
	return [
		{
			title: <span className={NormalClassName}>工种</span>,
			key: "jobType",
			dataIndex: "jobType",
			width: 130,
			fixed: "left",
			render: (value: string) => {
				const item = jobColor?.[value] || { bg: "#F4EEFE", color: "#A174F6" };
				return (
					<div className="flex items-center justify-start">
						<span
							className={`mr-1 flex h-6 w-6 items-center justify-center ${NormalClassName} `}
							style={{
								backgroundColor: item.bg,
								color: item.color,
								borderRadius: "50%",
							}}
						>
							{value?.substring(0, 1)}
						</span>
						<span className={NormalClassName}>{value}</span>
					</div>
				);
			},
		},
		{
			title: <span className={NormalClassName}>实际支出(万元)</span>,
			dataIndex: "actualExpenditure",
			key: "actualExpenditure",
			fixed: "left",
			render: (value: number) => {
				return <span className={NormalClassName}>{addThousand(value?.toFixed(2))}</span>;
			},
		},
		{
			title: <span className={NormalClassName}>剩余预算(万元)</span>,

			dataIndex: "averageSalary",
			key: "averageSalary",
			fixed: "left",
			render: (value: number) => {
				return <span className={NormalClassName}>{addThousand(value?.toFixed(2))}</span>;
			},
		},
		{
			title: <span className={NormalClassName}>平均薪酬(万元)</span>,
			dataIndex: "status",
			key: "status",
			fixed: "left",
			render: (value: number) => {
				return <span className={NormalClassName}>{addThousand(value?.toFixed(2))}</span>;
			},
		},
	];
}

const costsExpectedOption = {
	tooltip: {
		show: true,
		trigger: "axis",
		backgroundColor: "transparent",
		borderColor: "transparent",
		// 自定义毛玻璃样式
		extraCssText: `
					backdrop-filter: blur(10px);
					-webkit-backdrop-filter: blur(10px);
					background: linear-gradient(304.17deg, rgba(241, 246, 255, 0.6) -6.04%, rgba(217, 237, 255, 0.6) 85.2%);
					border-radius: 8px;
					padding: 12px;
					box-shadow: 0px 0px 8px 0px #0000001F;
				`,
		formatter: (params: any) => {
			const { name } = params?.[0];
			const relVal = params?.map((item: any) => {
				const { value, color, seriesName, seriesType } = item;
				return `<div style="display: flex; justify-content: space-between;  align-items: center;color:var(--fristemphasis-font-color)">
											<div>
												<span style="width:10px;height:10px;display:inline-block; ${seriesType === "line" ? `border-radius:50%;border:1px solid ${color};background-color:#fff;` : `border-radius:2px;background-color:${color};`}"></span>
												<span style="font-size:12px;color:#323233">${seriesName}</span>
											</div>
											<span style="font-size:12px;font-weight:500;margin-left:5px;color:${value > 0 ? "#000000" : "#F5222D"}">${addThousand(value.toFixed(2))}</span>
										</div> `;
			});
			return `<div style="width:200px;height:86px;">
										<div style="font-weight:500;margin-bottom:5px;font-size:14px;color:#000000;display:flex;justify-content:space-between;">
											<span>x年${name}</span>
											<span style="font-size:10px;color:#323233">单位：万元</span>
										</div>
											${relVal?.join("")}
									 </div>
									`;
		},
	},
	grid: {
		left: 65,
		right: 0,
		bottom: 0,
		top: 10,
	},
	xAxis: {
		type: "category",
		data: [
			"1月",
			"2月",
			"3月",
			"4月",
			"5月",
			"6月",
			"7月",
			"8月",
			"9月",
			"10月",
			"11月",
			"12月",
		],
		triggerEvent: true,
		axisLine: {
			lineStyle: {
				color: "#F5222D",
			},
		},

		axisLabel: {
			show: true,
			textStyle: {
				fontSize: 11,
			},
		},
	},
	yAxis: [
		{
			type: "value",
			splitLine: {
				lineStyle: {
					type: "dashed",
					color: "#EBEEF5",
				},
			},
			axisLabel: {
				show: true,
				textStyle: {
					fontSize: 11,
				},
				formatter(value: number) {
					// 隐藏 0 刻度
					if (value === 0) {
						return "";
					}
					return value;
				},
			},
			splitNumber: 5,
		},
	],
	series: [
		{
			type: "bar",
			data: [600, 700, 650, 620, 750, 700, 720, 780, 400, 650, 700, 800],
			name: "月度预算",
			barWidth: 10,

			showBackground: false,
			itemStyle: {
				color: "#2C55E6",
			},
		},
		{
			type: "bar",
			data: [150, 100, 120, 130, 250, 150, 180, 120, 200, 200, 150, 150],

			name: "实际支出",
			barWidth: 10,
			showBackground: false,
			itemStyle: {
				color: "#0075FF",
			},
		},
		{
			type: "bar",
			name: "剩余预算",
			data: [
				800.0, 187.5, 184.4, 182.7, 725.0, 182.4, 80.0, 286.7, -166.7, 276.5, 282.4, 284.2,
			],
			barWidth: 10,
			markLine: {
				silent: true,
				symbol: "none",

				data: [
					{
						type: "average",
						value: "平均值",
						yAxis: 0,
						label: {
							position: "start",
							formatter: "剩余预算0",
							color: "#F5222D",
							fontSize: 11,
						},
						lineStyle: {
							color: "#FF4040",
							type: "solid",
						},
					},
				],
			},
			itemStyle: {
				color: "#31E0D5",
			},
		},
	],
};
export {
	costsCompareFakeData,
	costsExpectedCompareFakeData,
	costsExpectedOption,
	fakeData,
	fakeData2,
	fakeGroupData,
	gaugeOtion,
	getColumns,
	getCostsCompareColumns,
	getCostsExpectedCompareColumns,
	getGroupColumns,
	getSalaryDetailColumns,
	NormalClassName,
	SalaryDetailfakeData,
};
