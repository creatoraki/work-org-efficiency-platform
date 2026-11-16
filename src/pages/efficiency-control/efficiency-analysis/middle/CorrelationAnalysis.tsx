import { SectionTitle } from "#src/components";
import useInitEcharts from "#src/hooks/use-echarts/useInitEcharts";
import { useRef } from "react";
import { correlationAnalysisOption } from "./config";

export default function CorrelationAnalysis() {
	const ref = useRef<HTMLDivElement>(null);

	useInitEcharts({
		ref,
		options: correlationAnalysisOption as any,
	});
	return (
		<div
			className="flex min-h-0 w-full flex-col rounded-md bg-[#FFFFFF] p-4"
			style={{
				boxShadow: "0px 0px 12px 0px #0000001F ",
			}}
		>
			<SectionTitle
				title={
					<span className="text-sm font-medium md:text-base">X年人力成本关联分析</span>
				}
			/>
			<div ref={ref} className="mt-2 h-full min-h-0 w-full flex-1" />
		</div>
	);
}
