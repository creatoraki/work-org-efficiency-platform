import blueConfirm from "#src/assets/svg/blue-confirm.svg";
import { CloseOutlined } from "@ant-design/icons";
import { Badge, Button, Checkbox, Collapse, Drawer, Form, Modal, Table, Tooltip } from "antd";
import { useState } from "react";
import AIDrawer from "./AiDrawer";
import { getDetailColumns } from "./config";
import fakeData2 from "./fakeData2.json";

import "../efficiency-analysis/components/index.css";

interface DrawerProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	detail: any;
}
export default function DetailDrawer(props: DrawerProps) {
	const { open, setOpen, detail } = props;
	const [activeKey, setActiveKey] = useState(["1", "2", "3", "4", "5"]);
	const [openAi, setOpenAi] = useState(false);
	const [openUrgeModal, setOpenUrgeModal] = useState(false);
	const [hover, setHover] = useState(false);
	const [form] = Form.useForm();

	const { warningId = "", orgPath = "", warningContent = "" } = detail || {};

	// 关闭按钮
	const onClose = () => {
		setOpen(false);
	};
	const onChange = (key: string[]) => {
		setActiveKey(key);
	};

	const urgeHandle = (e: any) => {
		e.stopPropagation();
		setOpenUrgeModal(true);
	};

	const handleCancel = () => {
		setOpenUrgeModal(false);
	};

	const handleConfirm = async () => {
		form.submit();
		form.validateFields().then(() => {
			setOpenUrgeModal(false);
		});
	};

	return (
		<Drawer
			closable={false}
			onClose={onClose}
			open={open}
			width="60%"
			height="100vh"
			size="large"
			title={warningId}
			extra={
				<Button
					type="text"
					icon={<CloseOutlined />}
					onClick={onClose}
					className="text-gray-500 hover:text-gray-700"
				/>
			}
			classNames={{
				body: "scrollbar",
			}}
		>
			<Tooltip title="不知道怎么干预?看看AI助手的建议吧~" placement="left">
				<div
					className="absolute bottom-[100px] right-4 z-30 flex h-auto w-auto cursor-pointer flex-col items-center justify-center gap-1 rounded-[24px] px-1.5 py-2"
					style={{
						boxShadow: "0px 0px 4px 0px #0035904D",
						backgroundColor: hover ? "#5ca7ff" : "#0075FF",
					}}
					onClick={() => setOpenAi(true)}
					onMouseEnter={() => setHover(true)}
					onMouseLeave={() => setHover(false)}
				>
					<div className="flex flex-col items-center justify-center gap-1 text-[12px] text-[#fff]">
						<span>AI</span>
						<span>助</span>
						<span>手</span>
					</div>
				</div>
			</Tooltip>

			<Collapse
				className="h-full w-full"
				ghost
				activeKey={activeKey}
				onChange={onChange}
				items={[
					{
						key: "1",
						classNames: { header: " flex !items-center !px-0 !pt-0" },
						label: <span className="text-base font-medium">基本信息</span>,
						children: (
							<div className="flex w-full flex-wrap gap-y-3">
								<Target title="预警编号" detail={warningId} />
								<Target title="预警内容" detail={warningContent} />
								<Target title="所属组织" detail={orgPath} className="w-full" />
							</div>
						),
					},
					{
						key: "2",
						classNames: { header: "flex !items-center !px-0 !pt-0" },
						label: (
							<div className="flex items-center justify-between">
								<span className="text-base font-medium">一级预警</span>
								<Button
									type="primary"
									onClick={urgeHandle}
									disabled
									className="!bg-[#add3ff] !text-[#FFFFFF]"
								>
									催办
								</Button>
							</div>
						),
						children: <WarningTarget levelCode={2} levelText="黄色预警" />,
					},
					{
						key: "3",
						classNames: { header: " flex !items-center !px-0 !pt-0" },
						label: (
							<div className="flex items-center justify-between">
								<span className="text-base font-medium">二级预警</span>
								<Button type="primary" onClick={urgeHandle}>
									催办
								</Button>
							</div>
						),
						children: <WarningTarget levelCode={2} levelText="黄色预警" />,
					},
					{
						key: "4",
						classNames: { header: " flex !items-center !px-0 !pt-0" },
						label: (
							<div className="flex items-center justify-between">
								<span className="text-base font-medium">三级预警</span>
								{/* <Button type="primary" onClick={urgeHandle}>催办</Button> */}
							</div>
						),
						children: <WarningTarget levelCode={2} levelText="黄色预警" />,
					},
					{
						key: "5",
						classNames: { header: " flex !items-center !px-0 !pt-0" },
						label: <span className="text-base font-medium">催办记录</span>,
						children: (
							<Table
								className="showTable"
								size="small"
								// onChange={(pag, fil, sorter) => tableChange(pag, fil, sorter)}
								columns={getDetailColumns()}
								dataSource={fakeData2}
								pagination={false}
								tableLayout="fixed"
							/>
						),
					},
				]}
			/>
			<AIDrawer open={openAi} setOpen={setOpenAi} detail={detail} />
			<Modal
				centered
				style={{
					width: 428,
					height: 212,
				}}
				title={
					<div className="flex items-center">
						<img src={blueConfirm} alt="" className="mr-2" />
						<span>请确认是否催办</span>
					</div>
				}
				closable={{ "aria-label": "Custom Close Button" }}
				open={openUrgeModal}
				onOk={handleConfirm}
				onCancel={handleCancel}
			>
				<div className="flex items-center justify-start gap-4 px-4 py-2">
					<div>催办内容</div>
					<div>已预警3天1小时0分0秒，请尽快查阅处理</div>
				</div>

				<Form colon={false} form={form}>
					<Form.Item
						label="接收人"
						name="remark"
						className="px-4"
						rules={[{ required: true, message: "请选择催办接收人" }]}
					>
						<Checkbox.Group
							className="ml-2"
							options={["吴耀锋", "静香"]}
							defaultValue={["吴耀锋", "静香"]}
							// onChange={onChange}
						/>
					</Form.Item>
				</Form>
			</Modal>
		</Drawer>
	);
}

function WarningTarget(props: any) {
	const { levelCode, levelText } = props;
	return (
		<div className="flex w-full flex-wrap gap-y-4">
			<Target
				title="预警等级"
				detail={
					<Badge
						color={
							levelCode === 2 ? "#FFD900" : levelCode === 3 ? "#FF7D00" : "#F5222D"
						}
						text={levelText}
					/>
				}
			/>
			<Target
				title="预警触发条件"
				detail="总人力成本上月成本(11.00万元)>上月预算(10.00万元)，或总人力成本2025年累计成本(110.00万元)>2025年累计预算(100.00万元)"
			/>
			<Target title="预警日期" detail="2025-10-10" />
			<Target
				title="处理人"
				detail="赵艳(2025-10-1010:00:00已阅)，郑叶飞(2025-10-1010:00:00已阅)"
			/>
			<Target
				className="w-full"
				title="预警建议"
				detail="1.核查预算是否准确，穷尽;2.核查编制与在职，根据运营方案预算编制核查在职情况，无预算编制不入职，若存在人员超编需进行优化;3.核查项目当月的加班、调薪、晋升等，是否存在不当，尤其对于隐形的加班进行关注;"
			/>
		</div>
	);
}

export function Target(props: any) {
	const { title, detail, className } = props;
	return (
		<div className={`flex w-1/2 ${className}`}>
			<div className="mr-5 h-auto w-[84px] whitespace-nowrap text-end text-sm text-[#606266]">
				{title}
			</div>
			<div className="w-[calc(100%-92px)] text-[#000000]">{detail}</div>
		</div>
	);
}
