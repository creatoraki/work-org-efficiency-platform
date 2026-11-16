import { addCalendar, updateCalendar } from "#src/api/work-bench";
import navBgImage from "#src/assets/background-images/nav-list.png";
import workBenchBg from "#src/assets/background-images/work-bench-bg.png";
import left1Icon from "#src/assets/small-icons/work-bench/left-1.png";
import left2Icon from "#src/assets/small-icons/work-bench/left-2.png";
import left3Icon from "#src/assets/small-icons/work-bench/left-3.png";
import right1Icon from "#src/assets/small-icons/work-bench/right-1.png";
import right2Icon from "#src/assets/small-icons/work-bench/right-2.png";
import right3Icon from "#src/assets/small-icons/work-bench/right-3.png";
import HeartToHeart from "#src/assets/svg/communication.svg?react";
import bgImage from "#src/assets/svg/data-overview-bg.svg";
import hi from "#src/assets/svg/hi.svg";
import Strategy from "#src/assets/svg/strategy-breakdown.svg?react";
import TalentInsight from "#src/assets/svg/talent-insight.svg?react";
import { BasicContent } from "#src/components";
import { ShadowPanel } from "#src/components/shadow-panel/index";
import { useAccessStore, useAuthStore, useUserStore } from "#src/store";
import { useWorkBenchStore } from "#src/store/workbench";
import { LeftOutlined, RightOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Input, message, Modal } from "antd";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "motion/react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router";
import { DataOverview } from "./components/data-overview";
import { MeetingCalendar } from "./components/meeting-calendar";
import { QuickNavList } from "./components/quick-nav2";
import { Study } from "./components/study";
import { TodoComponent } from "./components/todo";
import { WarningMessage } from "./components/warning-message";

const MotionShadowPanel = motion.create(ShadowPanel);

export default function Home() {
	const user = useUserStore();
	const { routeList } = useAccessStore();
	const { redirectPath, clearRedirectPath } = useAuthStore();
	const { setPendingLinkQuery } = useWorkBenchStore();
	const navigate = useNavigate();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [form] = Form.useForm();
	const [refreshKey, setRefreshKey] = useState(0);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [studyKeyword, setStudyKeyword] = useState("");
	const deferredStudyKeyword = useDeferredValue(studyKeyword);

	const quickNavItems = useMemo(() => {
		const findRouteByPath = (routes: any[], path: string): any => {
			for (const route of routes) {
				if (route.path === path) return route;
				if (route.children) {
					const found = findRouteByPath(route.children, path);
					if (found) return found;
				}
			}
			return null;
		};

		const findFirstLeafPath = (route: any): string => {
			if (!route.children || route.children.length === 0) {
				return route.path;
			}
			return findFirstLeafPath(route.children[0]);
		};

		const getRedirect = (path: string) => {
			const route = findRouteByPath(routeList, path);
			if (!route) return null;
			return findFirstLeafPath(route);
		};

		const items = [
			{
				icon: <Strategy className="origin-center scale-[0.875]" />,
				label: "战略拆解",
				path: "/strategy",
			},
			{
				icon: <TalentInsight className="origin-center scale-[0.875]" />,
				label: "慧眼识才",
				path: "/tag-management",
			},
			{
				icon: <HeartToHeart className="origin-center scale-[0.875]" />,
				label: "推心置腹",
				path: "/personnel-archive",
			},
		];

		return items
			.map((item) => {
				const redirect = getRedirect(item.path);
				if (!redirect) return null;
				return {
					icon: item.icon,
					label: item.label,
					onClick: () => navigate(redirect),
				};
			})
			.filter(Boolean) as any[];
	}, [routeList, navigate]);

	useEffect(() => {
		if (!redirectPath) return;
		const normalizedRedirectPath = redirectPath.startsWith("/")
			? redirectPath
			: `/${redirectPath}`;

		// 从 redirectPath 中解析 query params，存入 workbenchStore 供目标页消费
		const queryIndex = normalizedRedirectPath.indexOf("?");
		if (queryIndex !== -1) {
			const pathOnly = normalizedRedirectPath.slice(0, queryIndex);
			const params = new URLSearchParams(normalizedRedirectPath.slice(queryIndex));
			const query: Record<string, string> = {};
			params.forEach((value, key) => {
				query[key] = value;
			});
			if (Object.keys(query).length > 0) {
				setPendingLinkQuery(pathOnly, query);
			}
		}

		clearRedirectPath();
		navigate(normalizedRedirectPath, { replace: true });
	}, [redirectPath, clearRedirectPath, navigate, setPendingLinkQuery]);

	const showModal = () => {
		setEditingId(null);
		setIsModalOpen(true);
		form.setFieldsValue({
			createTime: dayjs(),
			creator: user?.nickName,
			meetingName: "",
			monthRange: [],
		});
	};

	const handleEdit = (meeting: any) => {
		setEditingId(meeting.id);
		setIsModalOpen(true);
		form.setFieldsValue({
			meetingName: meeting.name,
			monthRange: [
				dayjs(`${meeting.startYear}-${meeting.startMonth}`),
				dayjs(`${meeting.endYear}-${meeting.endMonth}`),
			],
			createTime: meeting.createTime ? dayjs(meeting.createTime) : undefined,
			creator: meeting.createByName,
		});
	};

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			const { meetingName, monthRange, createTime } = values;
			const [start, end] = monthRange;

			const params = {
				meetingName,
				startTime: start.startOf("month").format("YYYY-MM-DD HH:mm:ss"),
				endTime: end.endOf("month").format("YYYY-MM-DD HH:mm:ss"),
				createTime: createTime?.format("YYYY-MM-DD HH:mm:ss"),
				createBy: user.id,
				createByName: user.nickName,
			};

			if (editingId) {
				await updateCalendar({ ...params, id: editingId });
				message.success("修改成功");
			} else {
				await addCalendar(params as any);
				message.success("新增成功");
			}

			setIsModalOpen(false);
			form.resetFields();
			setRefreshKey((prev) => prev + 1);
		} catch (error) {
			console.error("Validate Failed:", error);
		}
	};

	const handleCancel = () => {
		setIsModalOpen(false);
		form.resetFields();
	};

	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);
	const [direction, setDirection] = useState(0);

	const changeYear = (newYear: number) => {
		if (newYear > currentYear) return;
		setDirection(newYear > year ? 1 : -1);
		setYear(newYear);
	};

	const animationVariants = {
		enter: (dir: number) => ({
			x: dir > 0 ? 30 : -30,
			opacity: 0,
		}),
		center: {
			x: 0,
			opacity: 1,
		},
		exit: (dir: number) => ({
			x: dir < 0 ? 30 : -30,
			opacity: 0,
		}),
	};

	const hours = new Date().getHours();
	let period = "";
	if (hours >= 0 && hours < 6) {
		period = "凌晨";
	} else if (hours >= 6 && hours <= 12) {
		period = "上午";
	} else if (hours > 12 && hours < 18) {
		period = "下午";
	} else if (hours >= 18 && hours < 24) {
		period = "晚上";
	}

	return (
		<BasicContent className="!p-0">
			<div
				className="relative h-[calc(100vh-88px)] w-full overflow-auto"
				style={{
					backgroundImage: `url(${workBenchBg})`,
					backgroundSize: "100% auto",
					backgroundPosition: "top center",
					backgroundRepeat: "no-repeat",
				}}
			>
				<div className="pointer-events-none absolute inset-0"></div>
				{/* Grid 主容器 */}
				<div className="relative z-10 grid h-full w-full auto-rows-auto grid-cols-1 gap-x-4 gap-y-0 p-4 pb-2 pt-1 md:gap-x-2 md:gap-y-0 lg:grid-cols-[3fr_2fr] lg:grid-rows-[auto_1fr]">
					{/* 头部欢迎语 */}
					<div className="col-span-full flex-shrink-0 pb-1 pt-2">
						<div className="mb-1.5 flex items-center">
							<span className="mr-2 inline-flex items-center text-2xl text-blue-500">
								<img src={hi} alt="Hi" className="block h-6 w-6" />
							</span>
							<span className="text-sm font-semibold leading-none md:text-lg">
								{period}
								好，
								{user?.nickName}
							</span>
						</div>
						{/* 第二行：组织和角色加粗 */}
						<div className="text-xs text-gray-700 md:text-sm">
							您本次所在的组织是
							<span className="font-bold text-black">{user.dept?.deptName}</span>
							，您的角色是
							<span className="font-bold text-black">{user.staffJobName}</span>
							，欢迎登录您的管理工作台。
						</div>
					</div>

					{/* 左侧区域 Grid */}
					<div className="flex w-full flex-col gap-4 p-1 md:gap-3 lg:grid lg:min-h-0 lg:grid-rows-[101px_386fr_342fr] lg:overflow-hidden lg:pr-2 [@media(min-height:1000px)]:gap-5">
						<MotionShadowPanel
							initial={{ y: 300, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{
								type: "spring",
								stiffness: 40,
								damping: 12,
								mass: 1.2,
								delay: 0.5,
							}}
							className="flex max-h-[520px] min-h-0 flex-col bg-cover bg-top bg-no-repeat lg:max-h-none"
							style={{
								backgroundImage: `url(${navBgImage})`,
							}}
							header="快捷导航"
							icon={
								<img src={left1Icon} alt="快捷导航" className="h-[26px] w-[26px]" />
							}
						>
							<QuickNavList items={quickNavItems} />
						</MotionShadowPanel>
						<MotionShadowPanel
							initial={{ y: 300, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{
								type: "spring",
								stiffness: 40,
								damping: 12,
								mass: 1.2,
								delay: 0.7,
							}}
							header="待办任务"
							icon={
								<img src={left2Icon} alt="待办任务" className="h-[26px] w-[26px]" />
							}
							className="flex max-h-[520px] min-h-0 flex-col overflow-hidden lg:max-h-none"
						>
							<TodoComponent />
						</MotionShadowPanel>
						<MotionShadowPanel
							initial={{ y: 300, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{
								type: "spring",
								stiffness: 40,
								damping: 12,
								mass: 1.2,
								delay: 0.9,
							}}
							header="数据概览"
							icon={
								<img src={left3Icon} alt="数据概览" className="h-[26px] w-[26px]" />
							}
							className="flex max-h-[520px] min-h-0 flex-col overflow-hidden bg-cover bg-top bg-no-repeat lg:max-h-none"
							style={{
								backgroundImage: `url(${bgImage})`,
							}}
						>
							<DataOverview />
						</MotionShadowPanel>
					</div>

					{/* 右侧区域 Grid */}
					<div className="flex w-full flex-col gap-4 p-1 md:gap-3 lg:grid lg:min-h-0 lg:grid-rows-[384fr_223fr_233fr] lg:overflow-hidden [@media(min-height:1000px)]:gap-3">
						<MotionShadowPanel
							initial={{ y: 300, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{
								type: "spring",
								stiffness: 40,
								damping: 12,
								mass: 1.2,
								delay: 1.1,
							}}
							className="flex max-h-[520px] flex-col lg:max-h-none lg:min-h-0 lg:overflow-hidden"
							style={{
								backgroundColor: "#fff",
								backgroundImage:
									"linear-gradient(207.59deg, rgba(216, 38, 47, 0.12) 2.3%, rgba(255, 255, 255, 0) 81.31%)",
								backgroundRepeat: "no-repeat",
								backgroundSize: "100% 33%",
							}}
							header="预警消息"
							icon={
								<img
									src={right1Icon}
									alt="预警消息"
									className="h-[26px] w-[26px]"
								/>
							}
						>
							<WarningMessage />
						</MotionShadowPanel>
						<MotionShadowPanel
							initial={{ y: 300, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{
								type: "spring",
								stiffness: 40,
								damping: 12,
								mass: 1.2,
								delay: 1.3,
							}}
							header={
								<div className="flex w-full flex-wrap items-center justify-between gap-y-2">
									{/* 左侧：会议日历与日期切换 */}
									<div className="mr-auto flex items-center whitespace-nowrap text-sm font-normal">
										<span className="mr-2 inline-block align-middle">
											<img
												src={right2Icon}
												alt="会议月历"
												className="h-[26px] w-[26px]"
											/>
										</span>
										<span className="mr-4 text-lg font-medium">会议月历</span>
										<div
											className="flex h-6 w-6 translate-y-0.5 cursor-pointer items-center justify-center rounded text-gray-500 transition-colors hover:bg-blue-500 hover:text-white"
											onClick={() => changeYear(year - 1)}
										>
											<LeftOutlined style={{ fontSize: 12 }} />
										</div>
										<div className="relative mx-1 h-6 w-14 select-none overflow-hidden text-center text-base font-normal">
											<AnimatePresence
												initial={false}
												custom={direction}
												mode="popLayout"
											>
												<motion.div
													key={year}
													custom={direction}
													variants={animationVariants}
													initial="enter"
													animate="center"
													exit="exit"
													transition={{ duration: 0.3 }}
													className="absolute inset-0 flex items-center justify-center"
												>
													{year}年
												</motion.div>
											</AnimatePresence>
										</div>
										<div
											className={`flex h-6 w-6 translate-y-0.5 items-center justify-center rounded transition-colors ${
												year >= currentYear
													? "cursor-not-allowed text-gray-300"
													: "cursor-pointer text-gray-500 hover:bg-blue-500 hover:text-white"
											}`}
											onClick={() =>
												year < currentYear && changeYear(year + 1)
											}
										>
											<RightOutlined style={{ fontSize: 12 }} />
										</div>
									</div>
									{/* 右侧：状态统计与新增按钮 */}
									<div className="ml-auto flex flex-wrap items-center justify-end gap-2">
										{/* 状态统计 */}
										<span className="mr-2 flex items-center whitespace-nowrap">
											<span
												className="mr-1 inline-block h-2 w-2 rounded"
												style={{ background: "#14B968" }}
											></span>
											<span className="text-sm text-gray-700">已完成</span>
										</span>
										<span className="mr-2 flex items-center whitespace-nowrap">
											<span
												className="mr-1 inline-block h-2 w-2 rounded"
												style={{ background: "#0075FF" }}
											></span>
											<span className="text-sm text-gray-700">进行中</span>
										</span>
										<span className="mr-2 flex items-center whitespace-nowrap">
											<span
												className="mr-1 inline-block h-2 w-2 rounded"
												style={{ background: "#606266" }}
											></span>
											<span className="text-sm text-gray-700">未开始</span>
										</span>
										{/* 新增会议按钮 */}
										<Button onClick={showModal} size="small">
											新增会议
										</Button>
									</div>
								</div>
							}
							className="flex max-h-[520px] min-h-0 flex-col overflow-hidden lg:max-h-none"
						>
							<MeetingCalendar
								year={year}
								refreshKey={refreshKey}
								onEdit={handleEdit}
							/>
						</MotionShadowPanel>
						<MotionShadowPanel
							initial={{ y: 300, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{
								type: "spring",
								stiffness: 40,
								damping: 12,
								mass: 1.2,
								delay: 1.5,
							}}
							header={
								<div className="flex w-full flex-wrap items-center justify-between gap-3">
									<span className="whitespace-nowrap text-lg font-medium leading-7">
										文化学习
									</span>
									<Input
										value={studyKeyword}
										onChange={(event) => setStudyKeyword(event.target.value)}
										placeholder="搜索关键词"
										allowClear
										prefix={<SearchOutlined className="text-gray-400" />}
										className="w-full sm:w-[320px] lg:w-[300px] xl:w-[340px]"
										onClick={(event) => event.stopPropagation()}
										onKeyDown={(event) => event.stopPropagation()}
									/>
								</div>
							}
							icon={
								<img
									src={right3Icon}
									alt="文化学习"
									className="h-[26px] w-[26px]"
								/>
							}
							className="flex max-h-[520px] min-h-0 flex-col overflow-hidden lg:max-h-none"
						>
							<Study className="flex-1" keyword={deferredStudyKeyword} />
						</MotionShadowPanel>
					</div>
				</div>

				<Modal
					title={editingId ? "修改会议" : "新增会议"}
					centered
					open={isModalOpen}
					onOk={handleOk}
					onCancel={handleCancel}
				>
					<Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 16 }}>
						<Form.Item
							name="meetingName"
							label="会议名称"
							rules={[{ required: true, message: "请输入会议名称" }]}
						>
							<Input placeholder="请输入会议名称" />
						</Form.Item>
						<Form.Item
							name="monthRange"
							label="完成月份"
							rules={[{ required: true, message: "请选择完成月份" }]}
						>
							<DatePicker.RangePicker picker="month" style={{ width: "100%" }} />
						</Form.Item>
						<Form.Item name="createTime" label="创建时间">
							<DatePicker disabled style={{ width: "100%" }} showTime />
						</Form.Item>
						<Form.Item name="creator" label="创建人" className="mb-0">
							<Input disabled />
						</Form.Item>
					</Form>
				</Modal>
			</div>
		</BasicContent>
	);
}
