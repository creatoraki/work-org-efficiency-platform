import { BasicButton, BasicTable } from "#src/components";
import { CloseOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Drawer } from "antd";

import { useRef } from "react";
import { getSalaryDetailColumns, SalaryDetailfakeData } from "../config";

interface ProjCostRankProps {
	// role: RoleItemType
	open: boolean;
	setOpen: (open: boolean) => void;
}
export default function SalaryDetail(props: ProjCostRankProps) {
	const { open, setOpen } = props;
	const actionRef = useRef<any>();
	const formRef = useRef<any>();
	const onClose = () => {
		setOpen(false);
	};
	const request = async (pramas: any) => {
		const { pageSize, current } = pramas;

		return {
			data: SalaryDetailfakeData,
			success: true,
			total: SalaryDetailfakeData.length,
			pageSize,
			pageNum: current,
		};
	};
	return (
		<Drawer
			closable={false}
			onClose={onClose}
			open={open}
			width="80%"
			height="100vh"
			size="large"
			title="员工薪酬详情"
			extra={
				<Button
					type="text"
					icon={<CloseOutlined />}
					onClick={onClose}
					className="text-gray-500 hover:text-gray-700"
				/>
			}
		>
			<div className="flex h-full w-full flex-col">
				<div className="mb-4 w-full text-end">
					<BasicButton
						type="default"
						key="import"
						// onClick={handleImport}
						icon={<UploadOutlined />}
						// auth={TAG_MANAGEMENT_PERMISSIONS.JOB_DESCRIPTION_IMPORT}
					>
						导出
					</BasicButton>
				</div>
				<div className="h-full min-h-0 w-full flex-1">
					<BasicTable
						cardProps={false}
						// rowKey="roleId"
						adaptive={{
							offsetBottom: 16,
						}}
						columns={getSalaryDetailColumns() as any}
						request={request as any}
						actionRef={actionRef}
						formRef={formRef}
						cardBordered={false}
						search={{
							className: "!m-0 !p-0 ",
							labelWidth: "auto",
							span: { xs: 6, sm: 6, md: 6, lg: 6, xl: 6, xxl: 6 },
							defaultCollapsed: false,
							optionRender: false,
						}}
						options={false}
					/>
				</div>
			</div>
		</Drawer>
	);
}
