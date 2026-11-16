import analysisAiBtn from "#src/assets/analysis-ai-btn@2x.png";
import blueConfirm from "#src/assets/svg/blue-confirm.svg";
import warning from "#src/assets/svg/red-warning.svg";
import { CloseOutlined } from "@ant-design/icons";
import { Button, Modal, Tooltip } from "antd";
import { useEffect, useState } from "react";

import { useOrgStore } from "../store";
import AiModal from "./AiModal";

export default function Header() {
	const [openAiModal, setOpenAiModal] = useState(false);
	const [hintModal, setHintModal] = useState(true);
	const [hintTip, setHintTip] = useState(true);
	const { org_name } = useOrgStore();

	// 关闭弹窗
	const closeHintModal = () => {
		setHintModal(false);
	};
	// 关闭tip
	const closeHintTip = (e: any) => {
		e.stopPropagation();
		setHintTip(false);
	};

	useEffect(() => {
		if (openAiModal) {
			setHintTip(false);
		}
	}, [openAiModal]);

	return (
		<>
			<div className="flex h-[30px] h-auto w-full items-center justify-between pl-4 pr-2">
				<div className="flex items-center">
					<div className="whitespace-nowrap text-sm font-medium md:text-lg">
						{org_name}
					</div>
					<div className="ml-10 flex items-center whitespace-nowrap rounded-md bg-[#FFECE8] px-2 py-1 text-xs md:ml-4 md:text-sm">
						<img src={warning} className="mr-2" />
						<span>该组织XX月共有</span>
						<span className="mx-2 font-medium text-[#F5222D]">1</span>
						<span>条预警消息，请点击</span>
						<span className="ml-2 cursor-pointer font-medium text-[#0075FF]">
							查看详情
						</span>
					</div>
				</div>

				<div
					className="w-142 h-34 relative cursor-pointer"
					style={{
						width: 142,
						height: 34,
						backgroundImage: `image-set(url(${analysisAiBtn}) 2x)`,
					}}
					onClick={() => setOpenAiModal(true)}
				>
					<Tooltip
						placement="bottomRight"
						color="#fff"
						styles={{
							body: {
								width: 300,
								height: 50,
								display: "flex",
								justifyContent: "center",
							},
						}}
						open={hintTip}
						title={
							<div className="flex items-center whitespace-nowrap font-medium">
								<img src={blueConfirm} alt="" className="mr-2 h-4 w-4" />
								<span className="whitespace-nowrap">
									点击【AI助手】，进行AI人效分析
								</span>
								<CloseOutlined
									className="ml-6 cursor-pointer"
									onClick={closeHintTip}
								/>
							</div>
						}
						getPopupContainer={(triggerNode: any) => triggerNode.parentNode}
					>
						<div className="text-[rgba(255 255 255 0)] absolute bottom-0 right-4 h-1 w-1">
							{" "}
						</div>
					</Tooltip>
				</div>
				<AiModal open={openAiModal} setOpen={setOpenAiModal} />

				<Modal
					centered
					open={hintModal}
					maskClosable={false}
					title={
						<div className="flex items-center font-medium">
							<img src={blueConfirm} alt="" className="mr-2" />
							<span>温馨提示</span>
						</div>
					}
					footer={[
						<Button type="primary" onClick={closeHintModal} key="i know">
							我知道了
						</Button>,
					]}
					styles={{
						content: {
							width: 480,
						},
						header: {
							border: "none",
							padding: 16,
						},
						body: {
							padding: "0 40px",
						},
						footer: {
							border: "none",
							padding: 16,
						},
					}}
					onOk={closeHintModal}
					onCancel={closeHintModal}
				>
					<div>1、本系统已上线的AI人效分析，需从右上角的【AI助手】进入</div>
					<div>2、当前页面迭代升级中，暂未上线使用。</div>
				</Modal>
			</div>
		</>
	);
}
