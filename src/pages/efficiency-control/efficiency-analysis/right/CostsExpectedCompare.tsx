//

import budget from "#src/assets/svg/budget.svg";
import checkCircle from "#src/assets/svg/check-circle.svg";
import exceedBudget from "#src/assets/svg/exceed-budget.svg";
import expend from "#src/assets/svg/expend.svg";
import close from "#src/assets/svg/red-close.svg";
import { SectionTitle, SubTitle } from "#src/components";
import useInitEcharts from "#src/hooks/use-echarts/useInitEcharts";
import { ConfigProvider, Segmented } from "antd";
import { useRef, useState } from "react";
import { Target } from "../middle/ProjCostCompare";
import { costsExpectedOption } from "./config";

const list = [
	{
		color: "#2C55E6",
		text: "月度预算",
	},
	{
		color: "#0075FF",
		text: "实际支出",
	},
	{
		color: "#31E0D5",
		text: "剩余预算",
	},
];
export default function CostsExpectedCompare() {
	const ref = useRef<HTMLDivElement>(null);
	const [isexceedBudget] = useState(true);

	useInitEcharts({
		ref,
		options: costsExpectedOption as any,
	});

	return (
		<div
			className="flex h-auto min-h-0 flex-col rounded-md bg-[#FFFFFF] p-4"
			style={{
				boxShadow: "0px 0px 12px 0px #0000001F ",
			}}
		>
			<div className="flex h-auto w-full items-center justify-between">
				<SectionTitle
					title={
						<span className="text-sm font-medium md:text-base">
							X年人力成本预实对比
						</span>
					}
				/>
				<span className="text-xs text-[#606266] md:text-sm">单位：万元</span>
			</div>
			<div className="mt-2 flex h-full min-h-0 w-full flex-1 flex-col">
				<div className="mb-2 flex h-auto w-full flex-shrink-0 flex-wrap items-center justify-between">
					<ConfigProvider
						theme={{
							components: {
								Segmented: {
									itemSelectedColor: "#0075FF",
									itemHoverColor: "#0075FF",
									trackBg: "#F5F7FA",
								},
							},
						}}
					>
						<Segmented
							className="compare-tab-segmented"
							options={["总人力成本", "员工薪酬", "分摊成本", "可变成本", "储备成本"]}
						/>
					</ConfigProvider>
					<div className="flex w-auto gap-2">
						{list.map((item) => (
							<div key={item.text} className="flex items-center justify-between">
								<div
									className="mr-1 h-2 w-2 rounded-sm"
									style={{ background: item.color }}
								/>
								<span className="text-10 whitespace-nowrap text-[#606266] md:text-xs">
									{item.text}
								</span>
							</div>
						))}
					</div>
				</div>

				<div
					ref={ref}
					className="h-full min-h-0 w-full [@media(max-height:1000px)]:min-h-[100px]"
				/>

				<SubTitle
					className="mt-2 flex-shrink-0 [@media(max-height:1000px)]:mt-1"
					title="X年人力成本预实对比—总人力成本"
				/>
				<div className="relative mt-2 flex h-auto min-h-[100px] w-full flex-shrink-0 flex-col gap-2.5 rounded border bg-[#fff] px-2.5 py-2 [@media(max-height:1000px)]:mt-1">
					<div
						className="w-atuo absolute -top-4 right-0 flex h-4 h-5 items-center justify-center bg-[#FEE4E6] px-1.5 py-1 text-[10px] text-[#F5222D] md:-top-5 md:text-xs"
						style={{
							borderRadius: "4px 4px 0 0",
							display: isexceedBudget ? "absolute" : "none",
						}}
					>
						<img src={exceedBudget} className="mr-0.5" />
						<span>超预算</span>
					</div>

					<div className="around flex h-auto w-full items-center justify-between [@media(max-height:1000px)]:max-h-[40px]">
						<Target img={budget} title="年度预算(万元)" number="8,360.00" />
						<div className="whitespace-nowrap rounded-full bg-[#EBEEF5] px-3 py-0.5 text-center text-xs text-[#606266] [@media(max-width:1600px)]:px-0.5 [@media(max-width:768px)]:px-3">
							减去
						</div>

						<Target img={expend} title="实际支出(万元)" number="9,360.00" />
						<div className="whitespace-nowrap rounded-full bg-[#EBEEF5] px-3 py-0.5 text-center text-xs text-[#606266] [@media(max-width:1600px)]:px-0.5 [@media(max-width:768px)]:px-3">
							等于
						</div>

						<Target
							img={isexceedBudget ? close : checkCircle}
							title="剩余预算(万元)"
							number={
								isexceedBudget ? (
									<span className="text-[#F5222D]">-1,000.00</span>
								) : (
									"-1,000.00"
								)
							}
						/>
					</div>
					<div className="w-full" style={{ borderTop: "1px solid #E4E7ED" }}></div>
					<div className="flex h-auto w-full items-center justify-around">
						<Target title="预算使用率(%)" number="90.00" />
						<Target title="预算偏差率(%)" number="-10.00" />
						<Target title="预算使用率地区排名" number="2/320" />
					</div>
				</div>
			</div>
		</div>
	);
}
