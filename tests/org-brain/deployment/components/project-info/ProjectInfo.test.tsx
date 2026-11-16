import type { DeploymentDetail } from "#src/api/org-brain/deployment";
import { ProjectInfoDescriptions } from "#src/pages/org-brain/deployment/components/panel/project-info/ProjectInfo";

import { render, screen } from "@testing-library/react";

describe("projectInfoDescriptions", () => {
	it("renders slash placeholders when text fields are empty", () => {
		const detail: DeploymentDetail = {
			id: "detail-1",
			projectInfo: {
				province: "",
				city: "",
				planDeliveryDate: "",
				deliveryArea: 0,
				deliveryHouseholds: undefined,
				projectTypeCode: "1",
				projectTypeName: "",
				propertyTypeName: "",
				projectGradeName: "",
				propertyFeeUnitPrice: undefined,
				deliveryStandardName: "",
				projectCycleName: "",
				operationPlan: "   ",
			},
			projectPositionMatrixList: [],
		};

		render(<ProjectInfoDescriptions detail={detail} />);

		expect(screen.queryByText("-")).not.toBeInTheDocument();
		expect(screen.getAllByText("/").length).toBeGreaterThan(0);
		expect(screen.getByText("物业费单价")).toBeInTheDocument();
	});
});
