import { ArrowDownOutlined, ArrowUpOutlined, EnterOutlined } from "@ant-design/icons";
import { Divider } from "antd";

import { useTranslation } from "react-i18next";

interface SearchFooterProps {
	searchItems: number;
}

export function SearchFooter({ searchItems }: SearchFooterProps) {
	const { t } = useTranslation();
	return (
		<>
			<Divider className="my-0 mt-2" />
			<div className="flex items-center justify-between px-4 py-2 text-xs">
				<div className="flex items-center">
					<span className="flex h-5 items-center justify-center rounded-md bg-[#F3F4F5] p-1 dark:bg-[#26313C]">
						<ArrowUpOutlined />
					</span>
					<span className="ml-2 flex h-5 items-center justify-center rounded-md bg-[#F3F4F5] p-1 dark:bg-[#26313C]">
						<ArrowDownOutlined />
					</span>
					<span className="ml-2">{t("widgets.search.navigate")}</span>
					<span className="ml-2 flex h-5 items-center justify-center rounded-md bg-[#F3F4F5] p-1 dark:bg-[#26313C]">
						ESC
					</span>
					<span className="ml-2">{t("widgets.search.close")}</span>
					<span className="ml-2 flex h-5 items-center justify-center rounded-md bg-[#F3F4F5] p-1 dark:bg-[#26313C]">
						<EnterOutlined />
					</span>
					<span className="ml-2">{t("widgets.search.select")}</span>
				</div>
				<span>
					{t("widgets.search.total", {
						total: searchItems,
					})}
				</span>
			</div>
		</>
	);
}
