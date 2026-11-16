import OrgPortraitBtn from "#src/assets/svg/org-portrait-btn.svg?react";
import { useState } from "react";

import { tabList } from "../left/OrgTree";
import { useOrgStore } from "../store";
import PortraitDrawer from "./PortraitDrawer";

export default function Header() {
	const [openAiModal, setOpenAiModal] = useState(false);
	const { orgFullName, standLayer, projOrgStatus } = useOrgStore();

	const getOrgStatusStyle = (status: string) => {
		const tab = tabList.find((t) => t.text === status);
		return {
			color: tab?.textColor,
			background: tab?.bgColor,
		};
	};
	return (
		<>
			<div className="flex h-[30px] h-auto w-full items-center justify-between pl-3 pr-2">
				<div className="flex items-center gap-1 whitespace-nowrap text-sm !font-medium md:text-lg">
					{projOrgStatus ? (
						<span
							className="whitespace-nowrap rounded px-1.5"
							style={getOrgStatusStyle(projOrgStatus)}
						>
							{projOrgStatus}
						</span>
					) : (
						<></>
					)}
					<div>{orgFullName?.split("|")?.reverse()?.[0] || "-"}</div>
				</div>
				{standLayer === "PROJ" ? (
					<OrgPortraitBtn
						className="relative -mr-[10px] cursor-pointer"
						onClick={() => setOpenAiModal(true)}
					/>
				) : (
					<></>
				)}
				<PortraitDrawer open={openAiModal} setOpen={setOpenAiModal} />
			</div>
		</>
	);
}
