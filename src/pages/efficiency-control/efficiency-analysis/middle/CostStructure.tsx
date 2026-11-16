import clickGuide from "#src/assets/svg/click-guide.svg";
import path1 from "#src/assets/svg/path1.svg";
import path2 from "#src/assets/svg/path2.svg";
import path3 from "#src/assets/svg/path3.svg";
import path4 from "#src/assets/svg/path4.svg";
import warning from "#src/assets/svg/white-warning.svg";
import { SectionTitle } from "#src/components";
import { useEffect, useState } from "react";
import { useOrgStore, useStructure } from "../store";

const employeeList = [
	"项目管理",
	"管家",
	"工程",
	"保安",
	"保洁",
	"绿化",
	"业务支持",
	"E.O",
	"其他",
];
const costList = ["招聘", "培训", "晋升", "调薪", "汰换", "招采计划", "员工关爱", "劳务工资"];

const blueStyle = {
	background: "linear-gradient(180deg, #0075FF 0%, #4E3CEF 100%)",

	color: "#FFFFFF",
	boxShadow: "0px 0px 12px 0px #3B6FFF80",
};
const greenStyle = {
	background: "linear-gradient(157.01deg, #29B470 37.18%, #007F55 112.44%)",
	color: "#FFFFFF",
	boxShadow: "0px 0px 16px 0px #00CA6780",
};
const purpleStyle = {
	background: "linear-gradient(99.15deg, #763BF6 9.44%, #484EFF 148.05%)",
	color: "#FFFFFF",

	boxShadow: "0px 0px 16px 0px #3A00A680",
};
const blueHoverStyle = {
	border: "1px solid #0075FFA3",
	color: "#0075FFA3",
	boxShadow: "0px 0px 12px 0px #C0C0C080",
};
const greenHoverStyle = {
	border: "1px solid #14B968A3",
	color: "#14B968A3",
	boxShadow: "0px 0px 12px 0px #C0C0C080",
};
const purpleHoverStyle = {
	border: "1px solid #9C6AFFA3",
	color: "#9C6AFFA3",
	boxShadow: "0px 0px 12px 0px #C0C0C080",
};
const normalStyle = {
	background: "none",
	boxShadow: "0px 0px 12px 0px #CCCCCC80",
};

export default function CostStructure() {
	const [isAbleClick, setIsAbleClick] = useState(true);
	const { structure, setStructure } = useStructure();
	const { org_tag } = useOrgStore();

	const [hover, setHover] = useState(0);
	const hanldeClick = (key: number, title: string) => {
		if (isAbleClick) {
			setStructure(key, title);
		}
	};
	const hanldeHover = (key: number) => {
		if (isAbleClick) {
			setHover(key);
		}
	};

	useEffect(() => {
		if (!org_tag) return;
		if (org_tag === "PROJ") {
			setIsAbleClick(false);
			setStructure(0, "");
		} else {
			setIsAbleClick(true);
			setStructure(1, "总人力成本");
		}
	}, [org_tag]);

	return (
		<div
			className="relative flex h-full min-h-0 flex-col rounded bg-[#FFFFFF] p-4"
			style={{
				boxSizing: "border-box",

				boxShadow: "0px 0px 8px 0px #0000001F ",
			}}
		>
			<SectionTitle
				title={<span className="text-sm font-medium md:text-base">人力成本结构</span>}
				style={{ fontSize: 18 }}
			/>
			{isAbleClick ? <img src={clickGuide} className="absolute right-4 top-6" /> : <></>}

			<div className="mt-2 flex min-h-0 flex-1 gap-8">
				<div
					className="relative h-full w-[13.5%] rounded border border-[#0075FF] text-center text-xs font-medium text-[#0075FF] md:text-sm"
					style={{
						textOrientation: "mixed",
						...(hover === 1 ? blueHoverStyle : {}),
						...(structure === 1 ? blueStyle : normalStyle),
						cursor: isAbleClick ? "pointer" : "not-allowed",
					}}
					onClick={() => hanldeClick(1, "总人力成本")}
					onMouseEnter={() => hanldeHover(1)}
					onMouseLeave={() => hanldeHover(0)}
				>
					<div
						className="flex h-full w-full flex-col items-center justify-center overflow-hidden"
						title="总人力成本"
					>
						<span>总</span> <span>人</span> <span>力</span> <span>成</span>{" "}
						<span>本</span>
					</div>

					<img
						src={path1}
						className="absolute -right-8 h-1/4 w-8"
						style={{
							top: "50%",
						}}
					/>
					<img
						src={path4}
						className="absolute -right-8 h-1/4 w-8"
						style={{
							bottom: "50%",
						}}
					/>
					<div
						style={{
							writingMode: "horizontal-tb",
							letterSpacing: 0,
						}}
					>
						<WarningBadge num={1} />
					</div>
				</div>

				<div className="max-h-100% flex w-[13.5%] flex-col justify-between gap-2">
					<div
						className="relative flex flex-col items-center justify-center rounded text-xs font-medium text-[#14B968] md:text-sm"
						style={{
							boxSizing: "border-box",
							border: "1px solid #14B968",
							height: "50%",
							cursor: isAbleClick ? "pointer" : "not-allowed",
							...(hover === 2 ? greenHoverStyle : {}),
							...(structure === 2 ? greenStyle : normalStyle),
							background:
								structure === 2
									? "linear-gradient(157.01deg, #14B968 41.51%, #00BACE 112.44%)"
									: "none",
						}}
						onClick={() => hanldeClick(2, "固定成本")}
						onMouseEnter={() => hanldeHover(2)}
						onMouseLeave={() => hanldeHover(0)}
					>
						固
						<br />
						定
						<br />
						成
						<br />
						本
						<br />
						<img
							src={path3}
							className="absolute -right-8 h-1/2 w-8"
							style={{
								bottom: "40%",
							}}
						/>
						<img
							src={path2}
							className="absolute -right-8 h-1/2 w-8"
							style={{
								top: "42%",
							}}
						/>
					</div>

					<div
						className="relative flex flex-col items-center justify-center rounded text-xs font-medium text-[#A174F6] md:text-sm"
						style={{
							boxSizing: "border-box",
							border: "1px solid #A174F6",
							height: "50%",
							cursor: isAbleClick ? "pointer" : "not-allowed",
							...(hover === 3 ? purpleHoverStyle : {}),
							...(structure === 3 ? purpleStyle : normalStyle),
							background:
								structure === 3
									? "linear-gradient(151.8deg, #9C6AFF 23.52%, #5B48FF 85.74%)"
									: "none",
						}}
						onClick={() => hanldeClick(3, "可变成本")}
						onMouseEnter={() => hanldeHover(3)}
						onMouseLeave={() => hanldeHover(0)}
					>
						可
						<br />
						变
						<br />
						成
						<br />
						本
						<br />
						<img
							src={path3}
							className="absolute -right-8 h-1/2 w-8"
							style={{
								bottom: "40%",
							}}
						/>
						<img
							src={path2}
							className="absolute -right-8 h-1/2 w-8"
							style={{
								top: "42%",
							}}
						/>
					</div>
				</div>
				<div className="max-h-100% flex h-full w-[73%] flex-col justify-between gap-2 rounded">
					<div
						className="flex w-full flex-col items-center justify-center rounded px-4 text-xs font-medium text-[#14B968] md:text-sm"
						style={{
							height: "36%",
							boxSizing: "border-box",
							border: "1px solid #14B968",
							cursor: isAbleClick ? "pointer" : "not-allowed",
							...(hover === 4 ? greenHoverStyle : {}),
							...(structure === 4 ? greenStyle : normalStyle),
						}}
						onClick={() => hanldeClick(4, "员工薪酬")}
						onMouseEnter={() => hanldeHover(4)}
						onMouseLeave={() => hanldeHover(0)}
					>
						<span>员工薪酬</span>
						<div
							className="scrollbar flex min-h-0 w-full flex-wrap gap-0.5 overflow-y-auto py-1 [@media(min-height:1000px)]:gap-2"
							style={{
								borderTop: "1px solid #E4E7ED",
							}}
						>
							{employeeList.map((e) => {
								return (
									<span
										key={e}
										className="rounded bg-[#EBEEF5] px-2 text-xs font-normal text-[#323233]"
									>
										{e}
									</span>
								);
							})}
						</div>
					</div>
					<div
						className="flex h-[13.7%] w-full items-center justify-center rounded text-xs font-medium text-[#14B968] md:text-sm"
						style={{
							height: "13.7%",
							boxSizing: "border-box",
							border: "1px solid #14B968",
							cursor: isAbleClick ? "pointer" : "not-allowed",
							...(hover === 5 ? greenHoverStyle : {}),
							...(structure === 5 ? greenStyle : normalStyle),
						}}
						onClick={() => hanldeClick(5, "分摊成本")}
						onMouseEnter={() => hanldeHover(5)}
						onMouseLeave={() => hanldeHover(0)}
					>
						分摊成本
					</div>
					<div
						className="flex w-full flex-col items-center justify-center rounded border border-[#A174F6] px-4 text-xs font-medium text-[#A174F6] md:text-sm"
						style={{
							height: "36%",
							cursor: isAbleClick ? "pointer" : "not-allowed",
							...(hover === 6 ? purpleHoverStyle : {}),
							...(structure === 6 ? purpleStyle : normalStyle),
						}}
						onClick={() => hanldeClick(6, "可变成本")}
						onMouseEnter={() => hanldeHover(6)}
						onMouseLeave={() => hanldeHover(0)}
					>
						<span>可变成本</span>
						<div
							className="scrollbar flex h-auto w-full flex-wrap gap-0.5 overflow-y-auto py-1 [@media(min-height:1000px)]:gap-2"
							style={{
								borderTop: "1px solid #E4E7ED",
							}}
						>
							{costList.map((e) => {
								return (
									<span
										key={e}
										className="rounded bg-[#EBEEF5] px-2 text-xs font-normal text-[#323233]"
									>
										{e}
									</span>
								);
							})}
						</div>
					</div>
					<div
						className="flex h-[13.7%] w-full items-center justify-center rounded border border-[#A174F6] text-xs font-medium text-[#A174F6] md:text-sm"
						style={{
							height: "13.7%",
							cursor: isAbleClick ? "pointer" : "not-allowed",
							...(hover === 7 ? purpleHoverStyle : {}),
							...(structure === 7 ? purpleStyle : normalStyle),
						}}
						onClick={() => hanldeClick(7, "储备成本")}
						onMouseEnter={() => hanldeHover(7)}
						onMouseLeave={() => hanldeHover(0)}
					>
						储备成本
					</div>
				</div>
			</div>
		</div>
	);
}

// 预警徽章
export function WarningBadge({ num }: { num: number }) {
	return (
		<div
			className="text-2.5 w-5.5 h-5.5 absolute -left-3.5 -top-3 flex flex-row items-center justify-center bg-[#F5222D] px-1.5 font-medium text-[#FFFFFF]"
			style={{
				boxShadow: "0px 2px 2px 0px #FF1D1D40",
				borderRadius: 100,
			}}
		>
			<img src={warning} className="mr-0.5 h-3 w-3" />
			{num}
		</div>
	);
}
