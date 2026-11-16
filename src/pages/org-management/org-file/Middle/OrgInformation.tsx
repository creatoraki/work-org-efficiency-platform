import type { OrgState } from "#src/api/org-management/org-file";
import EmptyDataSvg from "#src/assets/svg/empty-data.svg";
import LeftBtnActive from "#src/assets/svg/left-btn-active.svg";
import LeftBtnHover from "#src/assets/svg/left-btn-hover.svg";
import LeftBtn from "#src/assets/svg/left-btn.svg";
import MidBtnActive from "#src/assets/svg/mid-btn-active.svg";
import MidBtnHover from "#src/assets/svg/mid-btn-hover.svg";
import MidBtn from "#src/assets/svg/mid-btn.svg";
import RightBtnActive from "#src/assets/svg/right-btn-active.svg";
import RightBtnHover from "#src/assets/svg/right-btn-hover.svg";
import RightBtn from "#src/assets/svg/right-btn.svg";
import { SectionTitle } from "#src/components";
import { ConfigProvider, Descriptions, Empty, Select } from "antd";
import { useMemo, useState } from "react";
import { useOrgStore } from "../store";
import { getBusinessItems, getNotProjectItems, getOrgItems, getProjectItems } from "./config";

import "./index.css";

export default function OrgInformation(props: { orgData: OrgState | any }) {
	const { orgData } = props;
	const { standLayer } = useOrgStore();

	const [tab, setTab] = useState("businessList");
	const [hoverTab, setHoverTab] = useState("");
	const [empty, setEmpty] = useState({
		showEmpty: false,
		emptyTitle: "",
	});
	const [select, setSelect] = useState("");
	const changeSelect = (value: string) => {
		setSelect(value);
	};

	const items = useMemo(() => {
		if (orgData) {
			if (standLayer === "PROJ") {
				switch (tab) {
					case "businessList":
						if (!orgData?.businessList?.length) {
							setEmpty({ showEmpty: true, emptyTitle: "暂无商机信息" });
						} else {
							setEmpty({ showEmpty: false, emptyTitle: "" });
						}
						return getBusinessItems(
							orgData?.businessList?.find((item: any) => item.rankId === select) ||
								{},
						);
					case "project":
						if (!orgData?.project) {
							setEmpty({ showEmpty: true, emptyTitle: "暂无项目信息" });
						} else {
							setEmpty({ showEmpty: false, emptyTitle: "" });
						}
						return getProjectItems(orgData?.project);
					case "org":
						if (!orgData?.org) {
							setEmpty({ showEmpty: true, emptyTitle: "暂无组织信息" });
						} else {
							setEmpty({ showEmpty: false, emptyTitle: "" });
						}
						return getOrgItems(orgData?.org);
					default:
						return [];
				}
			} else {
				if (!orgData?.org) {
					setEmpty({ showEmpty: true, emptyTitle: "暂无组织信息" });
				} else {
					setEmpty({ showEmpty: false, emptyTitle: "" });
				}
				return getNotProjectItems(orgData?.org);
			}
		}
	}, [tab, orgData, select, standLayer]);

	const selectOptions = useMemo(() => {
		setSelect("");
		if (orgData?.businessList?.length) {
			setSelect(orgData.businessList[0].rankId);
			return orgData.businessList.map((item: any) => ({
				value: item.rankId,
				label: item.rankId,
			}));
		} else {
			return [];
		}
	}, [orgData]);

	return (
		<div
			className="flex min-h-0 flex-col rounded-md bg-[#FFFFFF] p-4 md:pt-2"
			style={{
				boxShadow: "0px 0px 12px 0px #0000001F ",
			}}
		>
			<SectionTitle title="组织信息" className="mb-3 text-base" />
			{standLayer === "PROJ" ? (
				<div className="mb-3 flex h-[32px] w-full items-center justify-between">
					<div className="steps-container flex w-1/2 justify-start">
						<div
							className="border-sm relative z-10 flex h-[28px] w-[160px] cursor-pointer items-center justify-center"
							onClick={() => setTab("businessList")}
							onMouseEnter={() => setHoverTab("businessList")}
							onMouseLeave={() => setHoverTab("")}
						>
							<img
								src={
									tab === "businessList"
										? LeftBtnActive
										: hoverTab === "businessList"
											? LeftBtnHover
											: LeftBtn
								}
								className="absolute"
							/>
							<span
								className={`absolute text-[${tab === "businessList" || hoverTab === "businessList" ? "#fff" : "#323233"}]`}
							>
								拓展
							</span>
						</div>
						<div
							className="border-sm relative -ml-[8px] flex h-[28px] w-[160px] cursor-pointer items-center justify-center"
							onClick={() => setTab("project")}
							onMouseEnter={() => setHoverTab("project")}
							onMouseLeave={() => setHoverTab("")}
						>
							<img
								src={
									tab === "project"
										? MidBtnActive
										: hoverTab === "project"
											? MidBtnHover
											: MidBtn
								}
								className="absolute"
							/>
							<span
								className={`absolute text-[${tab === "project" || hoverTab === "project" ? "#fff" : "#323233"}]`}
							>
								项目
							</span>
						</div>
						<div
							className="border-sm relative -ml-[8px] flex h-[28px] w-[160px] cursor-pointer items-center justify-center"
							onClick={() => setTab("org")}
							onMouseEnter={() => setHoverTab("org")}
							onMouseLeave={() => setHoverTab("")}
						>
							<img
								src={
									tab === "org"
										? RightBtnActive
										: hoverTab === "org"
											? RightBtnHover
											: RightBtn
								}
								className="absolute"
							/>
							<span
								className={`absolute text-[${tab === "org" || hoverTab === "org" ? "#fff" : "#323233"}]`}
							>
								组织
							</span>
						</div>
					</div>
					<div className="flex w-1/2 justify-end">
						{tab === "businessList" && selectOptions.length > 0 ? (
							<Select
								value={select}
								style={{ width: 120 }}
								onChange={changeSelect}
								options={selectOptions}
							/>
						) : (
							<></>
						)}
					</div>
				</div>
			) : (
				<></>
			)}
			{empty?.showEmpty ? (
				<div className="flex h-full w-full flex-col items-center justify-center">
					<Empty
						image={EmptyDataSvg}
						description={empty.emptyTitle}
						styles={{
							image: { width: "10vh", height: "10vh" },
						}}
					/>
				</div>
			) : (
				<ConfigProvider
					theme={{
						components: {
							Descriptions: {
								itemPaddingBottom: 14,
							},
						},
					}}
				>
					<Descriptions
						className="orgFileDescriptions custom-scrollbar flex-1 overflow-y-auto"
						styles={{
							label: {
								textAlign: "right",
								width: 120,
								display: "block",
								color: "#606266",
								marginRight: "24px",
							},
							content: { color: "#000000", fontSize: 14 },
						}}
						colon={false}
						items={items}
					/>
				</ConfigProvider>
			)}
		</div>
	);
}
