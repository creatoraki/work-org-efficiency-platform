import type { GetArchiveProjectTagRes } from "#src/api/org-management/org-file";
import { fetchOrgPortrait } from "#src/api/org-management/org-file";
import Pyramid from "#src/assets/svg/pyramid.svg";
import { SectionTitle } from "#src/components";
import { CloseOutlined } from "@ant-design/icons";
import { Button, ConfigProvider, Descriptions, Drawer } from "antd";
import { useEffect, useMemo, useState } from "react";

import { useOrgStore } from "../store";
import { getBasicItems, getKeyNodeItems, getOperateItems, getServiceItems } from "./config";
import "./index.css";

interface PortraitProps {
	open: boolean;
	setOpen: (open: boolean) => void;
}

export default function PortraitDrawer({ open, setOpen }: PortraitProps) {
	const { id } = useOrgStore();
	const [data, setData] = useState<GetArchiveProjectTagRes>();
	// 关闭按钮
	const onClose = () => {
		setOpen(false);
	};

	const getInfo = async () => {
		const { data } = await fetchOrgPortrait(id);
		setData(data);
	};
	useEffect(() => {
		if (id) {
			getInfo();
		}
	}, [id]);

	const list = useMemo(() => {
		if (!data) return [[], [], [], []];
		return [
			JSON.parse(data?.projServList || "[]"),
			JSON.parse(data?.projOperList || "[]"),
			JSON.parse(data?.keyNodeList || "[]"),
			JSON.parse(data?.baseInfoList || "[]"),
		];
	}, [data]);
	return (
		<Drawer
			closable={false}
			onClose={onClose}
			open={open}
			width="63%"
			height="100vh"
			size="large"
			title="组织画像"
			extra={
				<Button
					type="text"
					icon={<CloseOutlined />}
					onClick={onClose}
					className="text-gray-500 hover:text-gray-700"
				/>
			}
			classNames={{
				body: "custom-scrollbar",
			}}
		>
			<div className="custom-scrollbar relative h-[279px] w-full overflow-hidden overflow-x-auto rounded border border-[#E4E7ED] bg-[#F5F7FA]">
				<div className="absolute bottom-[26px] left-[462px] z-0 flex h-auto w-[580px] flex-col gap-[10px]">
					{list?.map((item: string[], index: number) => {
						return (
							<div
								key={`list${index}`}
								className="overflow-y-hiddden custom-scrollbar flex h-[40px] items-center overflow-x-auto rounded-md border border-[#fff] bg-[#fafbfd] px-2"
								style={{
									boxShadow: "0px 0px 2px 0px #FFFFFF40 inset",
								}}
							>
								{item?.length > 0 ? (
									item?.map((str: string, index: number) => (
										<div
											key={`item${index}`}
											className="mr-1 whitespace-nowrap rounded-sm bg-[#EBEEF5] px-2 py-1 text-xs text-[#323233]"
										>
											{str}
										</div>
									))
								) : (
									<div className="flex h-full w-full items-center justify-center text-sm text-[#909399]">
										无标签
									</div>
								)}
							</div>
						);
					})}
				</div>
				<img
					src={Pyramid}
					alt="组织架构"
					className="z-2 absolute left-[130px] top-0 h-[279px] w-[370px]"
				/>
			</div>
			<SectionTitle title="基本信息" className="my-5 text-base" />
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
					title={<></>}
					items={getBasicItems(data)}
				/>
				<SectionTitle title="关键节点" className="my-5 text-base" />
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
					title={<></>}
					items={getKeyNodeItems(data)}
				/>
				<SectionTitle title="项目运营" className="my-5 text-base" />
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
					title={<></>}
					items={getOperateItems(data)}
				/>
				<SectionTitle title="项目服务" className="my-5 text-base" />
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
					title={<></>}
					items={getServiceItems(data)}
				/>
			</ConfigProvider>
		</Drawer>
	);
}
