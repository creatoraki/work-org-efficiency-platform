import { SectionTitle } from "#src/components";
import useInitEcharts from "#src/hooks/use-echarts/useInitEcharts";
import { useRef } from "react";
import { useStructure } from "../store";
import { overviewOption } from "./config";

export default function ProjComplianceTrend() {
	const ref = useRef<HTMLDivElement>(null);
	const { structureTitle } = useStructure();

	useInitEcharts({
		ref,
		options: overviewOption as any,
	});
	return (
		<div
			className="flex h-full min-h-0 flex-col rounded-md bg-[#FFFFFF] p-4"
			style={{
				boxShadow: "0px 0px 12px 0px #0000001F ",
			}}
		>
			<SectionTitle
				title={
					<span className="text-sm font-medium md:text-base">
						X年项目达标率趋势
						{structureTitle ? `-${structureTitle}` : ""}
					</span>
				}
			/>
			<div className="relative mt-2 h-full min-h-0 w-full flex-1">
				<div
					ref={ref}
					className="h-full min-h-0 w-full overflow-hidden"
					style={{
						maxWidth: "100%",
						boxSizing: "border-box",
						minWidth: "0",
						width: "100%",
					}}
				/>
			</div>
		</div>
	);
}
