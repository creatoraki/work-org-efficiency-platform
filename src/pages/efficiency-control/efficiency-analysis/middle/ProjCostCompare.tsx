import type { CSSProperties, ReactNode } from "react";
import budget from "#src/assets/svg/budget.svg";
import checkCircle from "#src/assets/svg/check-circle.svg";
import DataDeclaration from "#src/assets/svg/data-declaration.svg?react";
import exceedBudget from "#src/assets/svg/exceed-budget.svg";
import expend from "#src/assets/svg/expend.svg";
import close from "#src/assets/svg/red-close.svg";
import { SectionTitle } from "#src/components";
import { Tooltip } from "antd";
import { useState } from "react";
import { useStructure } from "../store";

export default function ProjCostCompare() {
	const [isexceedBudget] = useState(true);
	const { structureTitle } = useStructure();

	return (
		<div
			className="flex min-h-0 flex-col rounded-md bg-[#FFFFFF] p-4 md:pt-2"
			style={{
				boxShadow: "0px 0px 12px 0px #0000001F ",
			}}
		>
			<SectionTitle
				title={
					<div className="relative flex-shrink-0">
						<span className="text-sm font-medium md:text-base">
							X年项目成本预实对比
							{structureTitle ? `-${structureTitle}` : ""}
						</span>
						<Tooltip placement="top" title="123">
							<DataDeclaration className="absolute top-0 cursor-pointer" />
						</Tooltip>
					</div>
				}
			/>
			<div className="relative mt-2 flex min-h-0 flex-1 flex-col rounded border bg-[#fff] px-2.5 py-1.5 md:gap-2.5">
				<div
					className="w-atuo absolute -top-4 right-0 flex h-4 items-center justify-center bg-[#FEE4E6] px-1.5 py-1 text-[10px] text-[#F5222D] md:-top-5 md:h-5 md:text-xs"
					style={{
						borderRadius: "4px 4px 0 0",
						display: isexceedBudget ? "absolute" : "none",
					}}
				>
					<img src={exceedBudget} className="mr-0.5" />
					<span>超预算</span>
				</div>

				<div className="around flex h-auto w-full flex-shrink-0 items-center justify-between">
					<Target img={budget} title="年度预算(万元)" number="8,360.00" />
					<div className="mx-3 whitespace-nowrap rounded-full bg-[#EBEEF5] px-3 py-0.5 text-center text-xs text-[#606266]">
						减去
					</div>
					<Target img={expend} title="实际支出(万元)" number="9,360.00" />
					<div className="mx-3 whitespace-nowrap rounded-full bg-[#EBEEF5] px-3 py-0.5 text-center text-xs text-[#606266]">
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
				<div
					className="w-full flex-shrink-0"
					style={{
						borderTop: "1px solid #E4E7ED",
					}}
				></div>
				<div className="flex h-auto w-full flex-shrink-0 items-center justify-around">
					<Target
						title="预算使用率(%)"
						number="110.00"
						style={{ flexDirection: "row", gap: 4 }}
					/>
					<Target
						title="预算偏差率(%)"
						number="-10.00"
						style={{ flexDirection: "row", gap: 4 }}
					/>
				</div>
			</div>
		</div>
	);
}

export function Target({
	img,
	title,
	number,
	style,
}: {
	title: string;
	number: ReactNode;
	img?: any;
	style?: CSSProperties;
}) {
	return (
		<div className="flex flex-col items-center justify-center" style={style}>
			<div className="flex items-center justify-center">
				{img ? <img src={img} className="h-4.5 w-4.5 md:h-5.5 md:w-5.5 mr-0.5" /> : <></>}
				<span className="whitespace-nowrap text-xs leading-4 md:text-sm">{title}</span>
			</div>
			<div className={`text-lg font-medium leading-tight md:text-xl ${img ? "ml-2" : ""}`}>
				{number}
			</div>
		</div>
	);
}
