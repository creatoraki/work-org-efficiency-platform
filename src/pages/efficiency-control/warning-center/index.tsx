import { BasicButton, BasicContent, BasicTable } from "#src/components";
import { UploadOutlined } from "@ant-design/icons";
import { Button, ConfigProvider, Segmented, Tabs } from "antd";
import { useRef, useState } from "react";
import { getColumns } from "./config";
import DetailDrawer from "./DetailDrawer";
import fakeData from "./fakeData.json";

const tabList = [
	{ tagName: "全部(11)" },
	{ tagName: "我的消息(4)" },
	{ tagName: "我的已催(4)" },
	{ tagName: "我的被催(3)" },
];

export default function WarningCenter() {
	const [open, setOpen] = useState(false);
	const [warningDetail, setWarningDetail] = useState<any | null>(null);
	const actionRef = useRef<any>();
	const formRef = useRef<any>();

	const openDetail = (record: any) => {
		setWarningDetail(record);
		setOpen(true);
	};

	const request = async (pramas: any) => {
		const { pageSize, current } = pramas;

		return {
			data: fakeData,
			success: true,
			total: fakeData.length,
			pageSize,
			pageNum: current,
		};
	};
	return (
		<BasicContent className="pt-2">
			<Tabs
				defaultActiveKey="1"
				items={tabList.map((item: any) => {
					return {
						label: item.tagName,
						key: item.tagName,
						children: <></>,
					};
				})}
			/>
			<ConfigProvider
				theme={{
					components: {
						Segmented: {
							itemSelectedColor: "#0075FF",
							itemHoverColor: "#0075FF",
							trackBg: "#F5F7FA",
						},
					},
				}}
			>
				<Segmented<string>
					className="my-4"
					options={["全部(7)", "待阅(4)", "已阅(7)"]}
					// onChange={(value) => {
					// 	console.log(value); // string
					// }}
				/>
			</ConfigProvider>
			<BasicTable
				cardProps={false}
				rowKey="roleId"
				adaptive={{
					offsetBottom: 16,
				}}
				columns={getColumns(openDetail)}
				request={request as any}
				actionRef={actionRef}
				formRef={formRef}
				cardBordered={false}
				search={{
					className:
						"!mb-0 !pt-0 !px-0 [&_.ant-pro-query-filter_.ant-form-item-label>label]:!whitespace-nowrap ",
					labelWidth: "auto",
					span: { xs: 6, sm: 6, md: 6, lg: 6, xl: 6, xxl: 6 },
					defaultCollapsed: false,
					optionRender: (searchConfig) => [
						<Button
							key="submit"
							type="primary"
							onClick={() => searchConfig.form?.submit()}
						>
							查询
						</Button>,
						<Button
							key="reset"
							type="text"
							onClick={() => {
								searchConfig.form?.resetFields();
								searchConfig.form?.submit();
							}}
						>
							重置
						</Button>,
					],
				}}
				options={{
					reload: false,
					density: false,
					fullScreen: false,
					setting: {
						settingIcon: <BasicButton>列表选项</BasicButton>,
					},
				}}
				toolbar={{
					className: "border-t",
					actions: [
						<BasicButton
							key="export"
							onClick={(e) => {
								e.stopPropagation();
							}}
							onFocus={(e: any) => {
								e.stopPropagation();
							}}
							type="default"
							icon={<UploadOutlined />}
						>
							导出
						</BasicButton>,
					],
				}}
			/>
			<DetailDrawer open={open} setOpen={setOpen} detail={warningDetail} />
		</BasicContent>
	);
}
