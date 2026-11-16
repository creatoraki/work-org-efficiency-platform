const overviewOption = {
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
												<span style="font-size:14px;color:#323233">${seriesName}</span>
											</div>
											<span style="font-size:14px;font-weight:500;margin-left:5px;color:#000000">${value}</span>
										</div> `;
			});
			return `<div style="width:200px;height:90px;">
			              <div style="font-size:14px;font-weight:500;margin-bottom:5px;font-size:16px;color:#000000">x年${name}</div>
											${relVal?.join("")}
			             </div>
			            `;
		},
	},
	grid: {
		left: "0%",
		right: "0%",
		bottom: "0%",
		top: 30,
	},
	legend: [
		{
			data: ["达标项目数(个)"],
			left: "0%",
			top: "0",
			align: "left",
			icon: "rect",
			itemWidth: 10,
			itemHeight: 10,
			itemStyle: { color: "rgba(0, 117, 255, 1)" },
		},
		{
			data: ["不达标项目数(个)"],
			left: "25%",
			top: "0",
			align: "left",
			icon: "rect",
			itemWidth: 10,
			itemHeight: 10,

			itemStyle: { color: "#31E0D5" },
		},
		{
			data: ["项目达标率(%)"],
			right: "0%",
			top: "0",
			itemWidth: 20,
			itemStyle: { color: "#31E0D5" },
		},
	],
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
				color: "#EBEEF5",
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
					fontSize: 14,
				},
			},

			splitNumber: 5,
		},
		{
			type: "value",
			splitLine: {
				show: false,
			},
			axisLabel: {
				show: true,
				textStyle: {
					fontSize: 14,
				},
			},
		},
	],
	series: [
		{
			type: "bar",
			data: [600, 700, 650, 620, 750, 700, 720, 780, 400, 650, 700, 800],
			name: "达标项目数(个)",
			barWidth: 10,

			showBackground: false,
			stack: "two",
			itemStyle: {
				color: "#0075FF",
			},
			yAxisIndex: 0,
		},
		{
			type: "bar",
			data: [150, 100, 120, 130, 250, 150, 180, 120, 200, 200, 150, 150],

			name: "不达标项目数(个)",
			barWidth: 10,
			showBackground: false,
			stack: "two",
			itemStyle: {
				color: "#31E0D5",
			},
			yAxisIndex: 0,
		},
		{
			type: "line",
			name: "项目达标率(%)",
			data: [80.0, 87.5, 84.4, 82.7, 75.0, 82.4, 80.0, 86.7, 66.7, 76.5, 82.4, 84.2],
			symbolSize: 10,
			itemStyle: {
				color: ["#31E0D5"],
			},
			yAxisIndex: 1,
		},
	],
};

const correlationAnalysisOption = {
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
											<span style="font-size:12px;font-weight:500;margin-left:5px;color:#000000">${value}</span>
										</div> `;
			});
			return `<div style="width:200px;height:90px;">
										<div style="font-weight:500;margin-bottom:5px;font-size:14px;color:#000000">x年${name}</div>
											${relVal?.join("")}
									 </div>
									`;
		},
	},
	grid: {
		left: 10,
		right: 10,
		bottom: 10,
		top: 30,
	},
	legend: [
		{
			data: ["总人力成本(万元)"],
			left: 15,
			top: "0",
			align: "left",
			icon: "rect",
			itemWidth: 10,
			itemHeight: 10,
			itemStyle: { color: "rgba(0, 117, 255, 1)" },
		},
		{
			data: ["总人力成本增速(%)"],
			right: 120,
			top: "0",
			itemWidth: 20,
			itemStyle: { color: "#31E0D5" },
		},
		{
			data: ["超编率(%)"],
			right: 20,
			top: "0",
			itemWidth: 20,
			itemStyle: { color: "#FF7D00" },
		},
	],
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
				color: "#EBEEF5",
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
					fontSize: 12,
				},
			},

			splitNumber: 5,
		},
		{
			type: "value",
			splitLine: {
				show: false,
			},
			axisLabel: {
				show: true,
				textStyle: {
					fontSize: 12,
				},
			},
		},
	],
	series: [
		{
			type: "bar",
			data: [600, 700, 650, 620, 750, 700, 720, 780, 400, 650, 700, 800],
			name: "总人力成本(万元)",
			barWidth: 10,

			showBackground: false,
			itemStyle: {
				color: "#0075FF",
			},
			yAxisIndex: 0,
		},
		{
			type: "line",
			data: [150, 100, 120, 130, 250, 150, 180, 120, 200, 200, 150, 150],

			name: "总人力成本增速(%)",
			barWidth: 10,
			showBackground: false,
			itemStyle: {
				color: "#31E0D5",
			},
			yAxisIndex: 0,
		},
		{
			type: "line",
			name: "超编率(%)",
			data: [80.0, 87.5, 84.4, 82.7, 75.0, 82.4, 80.0, 86.7, 66.7, 76.5, 82.4, 84.2],
			symbolSize: 10,
			itemStyle: {
				color: ["#FF7D00"],
			},
			yAxisIndex: 1,
		},
	],
};
const jobColor: any = {
	项目管理: { bg: "#e0eeff", color: "#0075FF" },
	保安: { bg: "#e0eeff", color: "#0075FF" },
	管家: { bg: "#FFEFE0", color: "#FF7D00" },
	工程: { bg: "#FFEFE0", color: "#FF7D00" },
	保洁: { bg: "#E3F7ED", color: "#14B968" },
	绿化: { bg: "#E3F7ED", color: "#14B968" },
	业务支持: { bg: "#F4EEFE", color: "#A174F6" },
	"E.O": { bg: "#F4EEFE", color: "#A174F6" },
	其他: { bg: "#F4EEFE", color: "#A174F6" },
};
const fakeData = [
	{
		type: "项目管理",
		icon: "项",
		color: "#52c41a", // 绿色
		passRate: "100.00%",
		passedProjects: 145,
		failedProjects: 0,
		progress: 100,
	},
	{
		type: "管家",
		icon: "管",
		color: "#f5222d", // 红色
		passRate: "60.00%",
		passedProjects: 60,
		failedProjects: 100,
		progress: 60,
	},
	{
		type: "工程",
		icon: "工",
		color: "#52c41a", // 绿色
		passRate: "90.00%",
		passedProjects: 90,
		failedProjects: 10,
		progress: 90,
	},
	{
		type: "保安",
		icon: "保",
		color: "#52c41a", // 绿色
		passRate: "80.00%",
		passedProjects: 80,
		failedProjects: 20,
		progress: 80,
	},
	{
		type: "保洁",
		icon: "保",
		color: "#f5222d", // 红色
		passRate: "0.00%",
		passedProjects: 0,
		failedProjects: 120,
		progress: 0,
	},
	{
		type: "绿化",
		icon: "绿",
		color: "#52c41a", // 绿色
		passRate: "90.00%",
		passedProjects: 90,
		failedProjects: 10,
		progress: 90,
	},
	{
		type: "业务支持",
		icon: "业",
		color: "#52c41a", // 绿色
		passRate: "90.00%",
		passedProjects: 90,
		failedProjects: 10,
		progress: 90,
	},
	{
		type: "E.O",
		icon: "业",
		color: "#52c41a", // 绿色
		passRate: "90.00%",
		passedProjects: 90,
		failedProjects: 10,
		progress: 90,
	},
	{
		type: "其他",
		icon: "其",
		color: "#52c41a", // 绿色
		passRate: "90.00%",
		passedProjects: 90,
		failedProjects: 10,
		progress: 90,
	},
];
const StaffDetailfakeData = [
	{
		rank: 1,
		jobType: "项目管理",
		overstaffRate: "115.00%",
		currentOverstaff: "25.00%",
		currentEmployed: 12,
		currentStaffing: 25,
	},
	{
		rank: 2,
		jobType: "管家",
		overstaffRate: "27.00%",
		currentOverstaff: "7.00%",
		currentEmployed: 57,
		currentStaffing: 97,
	},
	{
		rank: 3,
		jobType: "工程",
		overstaffRate: "29.00%",
		currentOverstaff: "9.00%",
		currentEmployed: 6,
		currentStaffing: 26,
	},
	{
		rank: 4,
		jobType: "保安",
		overstaffRate: "72.00%",
		currentOverstaff: "2.00%",
		currentEmployed: 62,
		currentStaffing: 82,
	},
	{
		rank: 5,
		jobType: "保洁",
		overstaffRate: "53.00%",
		currentOverstaff: "3.00%",
		currentEmployed: 36,
		currentStaffing: 56,
	},
	{
		rank: 6,
		jobType: "绿化",
		overstaffRate: "97.00%",
		currentOverstaff: "9.00%",
		currentEmployed: 29,
		currentStaffing: 6,
	},
	{
		rank: 7,
		jobType: "业务支持",
		overstaffRate: "100.00%",
		currentOverstaff: "10.00%",
		currentEmployed: 90,
		currentStaffing: 10,
	},
	{
		rank: 8,
		jobType: "E.O",
		overstaffRate: "42.00%",
		currentOverstaff: "4.00%",
		currentEmployed: 54,
		currentStaffing: 84,
	},
	{
		rank: 9,
		jobType: "其他",
		overstaffRate: "27.00%",
		currentOverstaff: "7.00%",
		currentEmployed: 87,
		currentStaffing: 9,
	},
	{
		rank: 10,
		jobType: "项目管理",
		overstaffRate: "29.00%",
		currentOverstaff: "9.00%",
		currentEmployed: 99,
		currentStaffing: 5,
	},
	{
		rank: 11,
		jobType: "管家",
		overstaffRate: "72.00%",
		currentOverstaff: "7.00%",
		currentEmployed: 57,
		currentStaffing: 8,
	},
	{
		rank: 12,
		jobType: "工程",
		overstaffRate: "53.00%",
		currentOverstaff: "3.00%",
		currentEmployed: 63,
		currentStaffing: 8,
	},
	{
		rank: 13,
		jobType: "保安",
		overstaffRate: "97.00%",
		currentOverstaff: "7.00%",
		currentEmployed: 87,
		currentStaffing: 87,
	},
	{
		rank: 14,
		jobType: "保洁",
		overstaffRate: "29.00%",
		currentOverstaff: "9.00%",
		currentEmployed: 91,
		currentStaffing: 10,
	},
	{
		rank: 15,
		jobType: "绿化",
		overstaffRate: "97.00%",
		currentOverstaff: "9.00%",
		currentEmployed: 59,
		currentStaffing: 8,
	},
	{
		rank: 16,
		jobType: "业务支持",
		overstaffRate: "100.00%",
		currentOverstaff: "20.00%",
		currentEmployed: 20,
		currentStaffing: 20,
	},
	{
		rank: 17,
		jobType: "E.O",
		overstaffRate: "72.00%",
		currentOverstaff: "2.00%",
		currentEmployed: 62,
		currentStaffing: 42,
	},
	{
		rank: 18,
		jobType: "其他",
		overstaffRate: "53.00%",
		currentOverstaff: "3.00%",
		currentEmployed: 83,
		currentStaffing: 93,
	},
	{
		rank: 19,
		jobType: "E.O",
		overstaffRate: "97.00%",
		currentOverstaff: "7.00%",
		currentEmployed: 75,
		currentStaffing: 85,
	},
	{
		rank: 20,
		jobType: "其他",
		overstaffRate: "53.00%",
		currentOverstaff: "3.00%",
		currentEmployed: 39,
		currentStaffing: 59,
	},
];

export { correlationAnalysisOption, fakeData, jobColor, overviewOption, StaffDetailfakeData };
