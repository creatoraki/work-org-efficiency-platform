import { SearchOutlined } from "@ant-design/icons";
import { ConfigProvider, Input, theme, Tooltip, Tree } from "antd";
import { useEffect, useState } from "react";

import { useOrgStore } from "../store";

import treeData from "./treeData.json";

const tabList = [
	{
		text: "全部",
		value: 1,
	},
	{
		text: "在管",
		value: 2,
	},
	{
		text: "计划交付",
		value: 3,
	},
	{
		text: "当拓当交",
		value: 4,
	},
	{
		text: "退出",
		value: 5,
	},
];

export default function OrgTree() {
	const [activeTab, setActiveTab] = useState(1);
	const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
	const { token } = theme.useToken();
	const { org_name, org_code, setOrg } = useOrgStore();

	const handleSelect = (selectedKeys: React.Key[], info: any) => {
		if (selectedKeys.length > 0) {
			const selectedNode = info.node;
			setOrg(selectedNode);
			setSelectedKeys(selectedKeys);
		}
	};

	const renderTreeNode = (node: any) => {
		return (
			<div className="flex h-full w-full min-w-0 items-start justify-between gap-1">
				{node.statusText ? (
					<span className="-ml-3 mr-3 rounded bg-[#E4EFFF] px-1 text-xs text-[#0075FF] md:pl-2 md:text-sm">
						{node.statusText}
					</span>
				) : (
					<></>
				)}
				<Tooltip placement="top" title={node.org_name}>
					<span className="-ml-3 min-w-0 flex-1 text-xs md:text-sm">{node.org_name}</span>
				</Tooltip>
			</div>
		);
	};

	useEffect(() => {
		if (!org_name) {
			setSelectedKeys([treeData?.[0]?.org_code]);
			setOrg({
				org_name: treeData?.[0]?.org_name,
				org_code: treeData?.[0]?.org_code,
				parent_org_code: treeData?.[0]?.parent_org_code,
				org_tag: treeData?.[0]?.org_tag,
			});
		} else {
			setSelectedKeys([org_code]);
		}
	}, []);

	return (
		<div className="scrollbar flex h-full min-h-0 w-full flex-col overflow-y-auto p-4">
			<div className="scrollbar mb-1 flex h-auto w-full items-center justify-between gap-2 overflow-x-auto pb-1">
				{tabList.map((item) => (
					<div
						className="md:xs flex cursor-pointer items-center justify-center whitespace-nowrap rounded border px-3 py-0.5 text-[10px] md:text-xs"
						key={item.text}
						style={{
							borderColor: activeTab === item.value ? "#0075FF" : "#E4E7ED",
							color: activeTab === item.value ? "#0075FF" : "#323233",
						}}
						onClick={() => setActiveTab(item.value)}
					>
						{item.text}
					</div>
				))}
			</div>

			<Input
				placeholder="支持模糊搜索"
				className="mb-2 flex-shrink-0"
				suffix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
				// value={inputText}
				// onChange={(e) => {
				// 	const v = e.target.value;
				// 	setInputText(v);
				// 	if (!v) {
				// 		// 立即生效清空并取消挂起的防抖
				// 		debouncedSetSearch.cancel && debouncedSetSearch.cancel();
				// 		setSearchValue("");
				// 	}
				// 	else {
				// 		debouncedSetSearch(v);
				// 	}
				// }}
				allowClear
			/>
			<ConfigProvider
				theme={{
					components: {
						Tree: {
							nodeSelectedColor: token.blue,
							nodeSelectedBg: "transparent",
						},
					},
				}}
			>
				<div className="h-full min-h-0 w-full flex-1 overflow-y-hidden">
					<Tree
						showLine
						treeData={treeData}
						selectedKeys={selectedKeys}
						onSelect={handleSelect}
						titleRender={renderTreeNode}
						fieldNames={{ title: "org_name", key: "org_code" }}
					/>
				</div>
			</ConfigProvider>
		</div>
	);
}
