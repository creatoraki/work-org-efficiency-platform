import { BasicButton, BasicContent, BasicTable } from "#src/components";
import { Button } from "antd";
import { useRef } from "react";
import { getColumns } from "./config";
import fakeData from "./fakeData.json";

export default function WarningCenter() {
	const actionRef = useRef<any>();
	const formRef = useRef<any>();

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
		<BasicContent>
			<BasicTable
				cardProps={false}
				// rowKey="roleId"
				adaptive={{
					offsetBottom: 16,
				}}
				columns={getColumns()}
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
				}}
			/>
		</BasicContent>
	);
}
