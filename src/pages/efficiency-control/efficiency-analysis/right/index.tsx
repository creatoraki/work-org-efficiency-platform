import { useOrgStore } from "../store";
import CostOverview from "./CostOverview";
import CostsExpectedCompare from "./CostsExpectedCompare";
import ProjComplianceSituation from "./ProjComplianceSituation";

export default function Right() {
	const { org_tag } = useOrgStore();
	return (
		<div
			className={`analysis-right h-full gap-4 p-2 ${org_tag !== "PROJ" ? "grid-rows-1" : "grid-rows-2"}`}
		>
			{org_tag !== "PROJ" ? (
				<ProjComplianceSituation />
			) : (
				<>
					<CostOverview />
					<CostsExpectedCompare />
				</>
			)}
		</div>
	);
}
