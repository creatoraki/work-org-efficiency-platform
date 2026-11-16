import EmptyDataSvg from "#src/assets/svg/empty-data.svg";
import ThroughIcon from "#src/assets/svg/through.svg?react";
import { SectionTitle } from "#src/components";
import { confirm } from "#src/components/custom-confirm/index.js";
import { TalentArchiveDrawer } from "#src/pages/org-brain/personnel-archive/components/talent-archive-drawer/index";
import { useAccessStore } from "#src/store";
import { Empty } from "antd";
import { useState } from "react";

export default function MangerChange(props: { directorChangeList: any }) {
	const { directorChangeList = [] } = props;
	const flatRouteList = useAccessStore((state) => state.flatRouteList);
	const [open, setOpen] = useState(false);
	const [person, setPerson] = useState<any>(null);
	const getItem = (item: any) => {
		const firstKey = Object.keys(item)[0];
		const firstValue = item[firstKey] || [];
		return firstValue;
	};

	const openDrawer = (person: any) => {
		if (!!flatRouteList["/org-brain/personnel-archive"] && person) {
			// 有组织大脑-人员档案的功能权限
			setOpen(true);
			setPerson(person);
		} else {
			confirm({
				title: "无权限",
				icon: "yellow",
				content: "您的账号未开通【组织大脑】-【人员档案】权限，请联系区域数智专员开启权限",
				centered: true,
				onOk: async () => {},
			});
		}
	};
	return (
		<div
			className="flex min-h-0 min-w-0 flex-col rounded-md bg-[#FFFFFF] p-4 md:pt-2"
			style={{
				boxShadow: "0px 0px 12px 0px #0000001F ",
			}}
		>
			<SectionTitle title="管理者变动" className="mb-2 mb-3 text-base" />
			<div className="custom-scrollbar flex w-full min-w-0 flex-1 items-center overflow-x-hidden rounded-sm border px-4">
				{!directorChangeList || directorChangeList?.length === 0 ? (
					<div className="flex h-full w-full flex-col items-center justify-center">
						<Empty
							image={EmptyDataSvg}
							description="暂无部门负责人"
							styles={{
								image: { width: "10vh", height: "10vh" },
							}}
						/>
					</div>
				) : (
					<>
						<div className="justify-content color-[#323233] mr-8 flex h-full w-auto items-center text-base">
							部门负责人
						</div>
						<div className="custom-scrollbar relative flex h-full flex-1 items-center overflow-y-auto pr-4">
							{directorChangeList?.map((item: any, index: number) => (
								<div
									key={getItem(item)?.[0]?.effectDate}
									className="flex h-auto w-auto flex-col items-start gap-1 whitespace-nowrap"
								>
									<div className="flex h-auto w-auto items-center justify-center">
										<ThroughIcon />
										{index === directorChangeList?.length - 1 ? (
											<></>
										) : (
											<div className="w-[220px] border-t border-dashed border-[#0075FF]"></div>
										)}
									</div>
									<span className="text-base text-[#000000]">
										{getItem(item)?.[0]?.effectDate}
									</span>
									{getItem(item)?.map((person: any) => {
										return (
											<div key={person?.directorName}>
												<span
													className={
														person?.jobStatus === "1"
															? "cursor-pointer text-sm text-[#0075FF]"
															: "text-sm text-[#323233]"
													}
													onClick={() =>
														person?.jobStatus === "1" &&
														openDrawer(person)
													}
												>
													{person?.directorName}
												</span>
												<span
													className={`text-[${person?.jobStatus === "1" ? "#0075FF" : "#323233"}] bg-[${person?.jobStatus === "1" ? "#E4EFFF" : "#EBEEF5"}] ml-1 rounded px-2 py-0.5 text-xs`}
												>
													{person?.jobStatus === "1" ? "在职" : "离职"}
												</span>
											</div>
										);
									})}
								</div>
							))}
						</div>
					</>
				)}
			</div>

			{/* 人才档案抽屉 */}
			<TalentArchiveDrawer
				open={open}
				userId={person?.id || ""}
				onClose={() => {
					setOpen(false);
					setPerson(null);
				}}
			/>
		</div>
	);
}
