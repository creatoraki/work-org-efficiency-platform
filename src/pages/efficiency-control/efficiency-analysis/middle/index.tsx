import { useOrgStore, useStructure } from "../store";
import CorrelationAnalysis from "./CorrelationAnalysis";
import CostStructure from "./CostStructure";
import ProjComplianceDistribution from "./ProjComplianceDistribution";
import ProjComplianceTrend from "./ProjComplianceTrend";

import ProjCostCompare from "./ProjCostCompare";
import StaffEstablish from "./StaffEstablish";
import "./index.css";

export default function Middle() {
	const { structure } = useStructure();
	const { org_tag } = useOrgStore();

	return (
		<div className="analysis-middle gap-4 px-2 py-2">
			<CostStructure />
			{org_tag !== "PROJ" ? (
				structure !== 4 ? (
					<>
						<ProjCostCompare />
						<ProjComplianceTrend />
					</>
				) : (
					<>
						<ProjComplianceDistribution />
						<ProjComplianceTrend />
					</>
				)
			) : (
				<>
					<StaffEstablish />
					<CorrelationAnalysis />
				</>
			)}
		</div>
	);
}
