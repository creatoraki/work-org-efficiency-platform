import efficiencyAnalysisBg from "#src/assets/org-file-bg.png";
import { BasicContent } from "#src/components";
import { useCallback, useState } from "react";
import Header from "./components/header";
import Left from "./left";
import Middle from "./Middle/index";

import "./index.css";
// import Right from "./right";
export default function OrgFile() {
	const [isSidebarFolded, setIsSidebarFolded] = useState<boolean>(false);

	const handleSidebarFoldChange = useCallback((folded: boolean) => {
		setIsSidebarFolded(folded);
	}, []);
	return (
		<BasicContent
			className="h-full w-full overflow-hidden"
			style={{
				boxSizing: "border-box",
				padding: 14,
				backgroundImage: `url(${efficiencyAnalysisBg})`,
				backgroundSize: "cover",
				backgroundPosition: "top center",
				backgroundRepeat: "no-repeat",
				// paddingLeft: "0.5rem"
			}}
		>
			<div className="grid h-full w-full" style={{ gridTemplateRows: "40px 1fr" }}>
				<Header />
				<div
					className={`orgfile-container custom-scrollbar ${isSidebarFolded ? "has-folded-org-left" : ""}`}
				>
					<Left onFoldChange={handleSidebarFoldChange} />

					<Middle />
				</div>
			</div>
		</BasicContent>
	);
}
