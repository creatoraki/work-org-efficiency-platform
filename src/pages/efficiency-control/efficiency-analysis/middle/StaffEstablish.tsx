import staffBg from "#src/assets/staff-bg.png";
import compilationNum from "#src/assets/svg/compilation-num.svg";
import DataDeclaration from "#src/assets/svg/data-declaration.svg?react";
import detail from "#src/assets/svg/detail.svg";
import employedNum from "#src/assets/svg/employed-num.svg";
import overstaffingNum from "#src/assets/svg/overstaffing-num.svg";
import overstaffingRate from "#src/assets/svg/overstaffing-rate.svg";
import { SectionTitle } from "#src/components";
import { Tooltip } from "antd";
import { useState } from "react";
import StaffDetail from "./components/StaffDetail";
import { Target } from "./ProjCostCompare";

export default function StaffEstablish() {
	const [openDetail, setOpenDetail] = useState(false);
	return (
		<div
			className="relative flex w-full flex-col rounded-md bg-[#FFFFFF] p-4"
			style={{
				boxShadow: "0px 0px 12px 0px #0000001F ",
			}}
		>
			<div
				className="absolute right-4 top-3 flex cursor-pointer items-center justify-center text-xs text-[#606266] md:text-sm"
				onClick={() => setOpenDetail(true)}
			>
				<span>详情</span>
				<img src={detail} />
			</div>
			<SectionTitle
				title={
					<div className="relative">
						<span className="text-sm font-medium md:text-base">人员编制</span>
						<Tooltip placement="top" title="123">
							<DataDeclaration className="absolute top-0 cursor-pointer" />
						</Tooltip>
					</div>
				}
			/>

			<div
				className="mt-2 flex min-h-0 flex-1 flex-wrap rounded border"
				style={{
					backgroundImage: `url(${staffBg})`,
					backgroundSize: "cover",
					backgroundPosition: "top center",
					backgroundRepeat: "no-repeat",
					borderTop: 0,
					borderLeft: 0,
					borderRight: 0,
				}}
			>
				<div
					className="flex h-1/2 w-1/2 items-center justify-between border px-4 py-1"
					style={{
						borderTop: 0,
						borderLeft: 0,
						borderRight: 0,
					}}
				>
					<Target title="超编率(%)" number="4,679" style={{ alignItems: "flex-start" }} />

					<div className="flex h-full w-auto items-start">
						<img src={overstaffingRate} className="h-5.5 w-5.5" />
					</div>
				</div>
				<div
					className="flex h-1/2 w-1/2 items-center justify-between border px-4 py-1"
					style={{
						borderTop: 0,
						borderRight: 0,
					}}
				>
					<Target
						title="当前超编人数(人)"
						number="4,679"
						style={{ alignItems: "flex-start" }}
					/>
					<div className="flex h-full w-auto items-start">
						<img src={overstaffingNum} className="h-5.5 w-5.5" />
					</div>
				</div>
				<div
					className="flex h-1/2 w-1/2 items-center justify-between border px-4 py-1"
					style={{
						borderTop: 0,
						borderRight: 0,
						borderLeft: 0,
						borderBottom: 0,
					}}
				>
					<Target
						title="当前在职人数(人)"
						number="4,679"
						style={{ alignItems: "flex-start" }}
					/>
					<div className="flex h-full w-auto items-start">
						<img src={employedNum} className="h-5.5 w-5.5" />
					</div>
				</div>
				<div
					className="flex h-1/2 w-1/2 items-center justify-between border px-4 py-1"
					style={{
						borderTop: 0,
						borderRight: 0,
						borderBottom: 0,
					}}
				>
					<Target
						title="当前编制人数(人)"
						number="4,679"
						style={{ alignItems: "flex-start" }}
					/>
					<div className="flex h-full w-auto items-start">
						<img src={compilationNum} className="h-5.5 w-5.5" />
					</div>
				</div>
			</div>
			<StaffDetail open={openDetail} setOpen={setOpenDetail} />
		</div>
	);
}
