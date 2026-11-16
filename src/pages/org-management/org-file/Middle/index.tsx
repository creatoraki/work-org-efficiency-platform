import type { GetOrgFileInfoRes } from "#src/api/org-management/org-file";
import { fetchOrgFileInfo } from "#src/api/org-management/org-file";
import { useEffect, useState } from "react";
import { useOrgStore } from "../store";
import MangerChange from "./MangerChange";
import OrgInformation from "./OrgInformation";
import Personformation from "./Personformation";
import ProjPersonformation from "./ProjPersonformation";
import ProjScale from "./ProjScale";

export default function Middle() {
	const [orgData, setOrgData] = useState<GetOrgFileInfoRes>();
	const { id, standLayer } = useOrgStore();

	const getInfo = async () => {
		const { data } = await fetchOrgFileInfo(id);
		setOrgData(data);
	};
	useEffect(() => {
		if (id) {
			getInfo();
		}
	}, [id]);

	return (
		<div
			className="orgfile-middle relative"
			style={
				standLayer === "TOP"
					? { gridTemplateRows: "20fr 70fr" }
					: standLayer === "PROJ"
						? { gridTemplateRows: "23fr 15fr 13fr" }
						: { gridTemplateRows: "20fr 25fr 43fr" }
			}
		>
			<OrgInformation orgData={orgData} />
			{standLayer !== "TOP" ? (
				<MangerChange directorChangeList={orgData?.directorChangeList} />
			) : (
				<></>
			)}

			{standLayer === "PROJ" ? (
				<ProjPersonformation staff={orgData?.staff} />
			) : standLayer === null ? (
				<Personformation />
			) : (
				<ProjScale />
			)}
		</div>
	);
}
