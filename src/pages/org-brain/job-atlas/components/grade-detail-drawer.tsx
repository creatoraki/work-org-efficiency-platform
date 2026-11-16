import type { JobAtlasGradeItemDetail } from "#src/api/org-brain/job-atlas";
import type { SalaryBandTableRow } from "./job-atlas-table-utils";
import { SectionTitle } from "#src/components";
import { cn } from "#src/utils";
import { DownOutlined } from "@ant-design/icons";
import { Drawer, Dropdown, Space, Table, Tabs, Typography } from "antd";
import { useMemo, useState } from "react";
import { buildSalaryBandRows, cellText, GRADE_STANDARD_SECTIONS } from "./job-atlas-table-utils";

export interface JobAtlasOptionItem {
	label: string;
	value: number;
}

interface GradeDetailDrawerProps {
	open: boolean;
	onClose: () => void;
	loading: boolean;
	currentRowGradeItems: JobAtlasOptionItem[];
	currentGradeItemId?: number;
	onGradeItemChange: (id: number) => void;
	gradeDetail?: JobAtlasGradeItemDetail;
}

export function GradeDetailDrawer(props: GradeDetailDrawerProps) {
	const {
		open,
		onClose,
		loading,
		currentRowGradeItems,
		currentGradeItemId,
		onGradeItemChange,
		gradeDetail,
	} = props;

	const [titleDropdownOpen, setTitleDropdownOpen] = useState(false);
	const gradeSalaryBandTable = useMemo(
		() => buildSalaryBandRows(gradeDetail?.salaryBandList ?? []),
		[gradeDetail?.salaryBandList],
	);

	return (
		<Drawer
			title={
				<div className="flex items-center">
					<Dropdown
						menu={{
							items: currentRowGradeItems.map((item) => ({
								key: String(item.value),
								label: item.label,
							})),
							onClick: ({ key }) => {
								onGradeItemChange(Number(key));
							},
						}}
						disabled={currentRowGradeItems.length === 0}
						open={titleDropdownOpen}
						onOpenChange={setTitleDropdownOpen}
					>
						<span
							className="inline-flex cursor-pointer"
							onClick={(e) => e.preventDefault()}
						>
							<Space>
								<Typography.Text className="text-xl font-medium">
									{`${currentRowGradeItems.find((item) => item.value === currentGradeItemId)?.label || "职级项"}任职标准`}
								</Typography.Text>
								<DownOutlined
									className={cn(
										"transition-transform duration-200 ease-out",
										titleDropdownOpen && "rotate-180",
									)}
								/>
							</Space>
						</span>
					</Dropdown>
				</div>
			}
			open={open}
			onClose={() => {
				setTitleDropdownOpen(false);
				onClose();
			}}
			width={1000}
			closable={{ placement: "end" }}
			destroyOnHidden
			styles={{
				body: {
					paddingTop: 0,
					paddingBottom: 0,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				},
			}}
		>
			<Tabs
				className={cn(
					"h-full min-h-0",
					"[&_.ant-tabs-nav]:mb-0",
					"[&_.ant-tabs-content-holder]:h-full [&_.ant-tabs-content-holder]:min-h-0",
					"[&_.ant-tabs-content]:h-full [&_.ant-tabs-content]:py-5 [&_.ant-tabs-tabpane]:h-full",
				)}
				items={[
					{
						key: "standard",
						label: "任职标准",
						children: (
							<div className="custom-scrollbar h-full min-h-0 overflow-y-auto overflow-x-hidden pr-2">
								<Space direction="vertical" size={16} className="w-full">
									{GRADE_STANDARD_SECTIONS.filter(
										(section) => !section.hideInGradeDetail,
									).map((section) => (
										<Space
											key={section.title}
											direction="vertical"
											size={10}
											className="w-full"
										>
											<SectionTitle title={section.title} className="!mb-0" />
											<div
												className={cn(
													"grid grid-cols-1 gap-4",
													!section.singleColumn && "md:grid-cols-2",
												)}
											>
												{section.fields.map((field) => (
													<div
														key={field.key}
														className="flex flex-col gap-3 rounded border border-[#DCDFE6] bg-white p-3"
													>
														<div className="text-sm font-medium">{`${field.label}:`}</div>
														<div className="whitespace-pre-wrap break-words text-sm">
															{cellText(gradeDetail?.[field.key])}
														</div>
													</div>
												))}
											</div>
										</Space>
									))}
								</Space>
							</div>
						),
					},
					{
						key: "salary-band",
						label: "薪资带宽",
						children: (
							<Table<SalaryBandTableRow>
								rowKey="key"
								loading={loading}
								columns={gradeSalaryBandTable.columns}
								dataSource={gradeSalaryBandTable.rows}
								pagination={false}
								bordered
								className="[&_.ant-table-thead>tr>th]:!bg-[#FFFFFF]"
							/>
						),
					},
				]}
			/>
		</Drawer>
	);
}
