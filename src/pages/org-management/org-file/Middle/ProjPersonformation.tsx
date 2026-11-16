import { SectionTitle } from "#src/components";
import { ConfigProvider, Descriptions } from "antd";
import { getStaffItems } from "./config";

export default function ProjPersonformation(props: { staff: any }) {
	const { staff } = props;
	return (
		<div
			className="flex min-h-0 flex-col rounded-md bg-[#FFFFFF] p-4 md:pt-2"
			style={{
				boxShadow: "0px 0px 12px 0px #0000001F ",
			}}
		>
			<SectionTitle title="人员信息" className="text-base" />
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
					items={getStaffItems(staff)}
				/>
			</ConfigProvider>
		</div>
	);
}
