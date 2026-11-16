import type { MatchingsProjectsRes } from "#src/api/efficiency-control/analysis/aiMoal";
import {
	getAIDataWithProgress,
	getAllMatchingProjs,
} from "#src/api/efficiency-control/analysis/aiMoal";
import { PdfBizType } from "#src/api/file/export-task";
import Bg from "#src/assets/ai-drawer-bg.png";
import { SectionTitle } from "#src/components";
import { Badge, Descriptions, Drawer, Typography } from "antd";
import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import {
	AIContent,
	CloseBtn,
	GOTopBtn,
	MatchingProgress,
} from "../efficiency-analysis/components/AiModal";

import ProgressSimulator from "../efficiency-analysis/components/ProgressSimulator";
import "../efficiency-analysis/components/index.css";

interface AiModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	detail?: Record<string, any> | null;
}
const project = { projCode: "GLXM20231030235610248760000", projName: "浙江·杭州·晓月澄庐" };
const analyseCode = "GLXM20231030235610248760000";
const DEFAULT_WARNING_TRIGGER_CONDITION =
	"总人力成本上月成本(11.00万元)>上月预算(10.00万元)，或总人力成本2025年累计成本(110.00万元)>2025年累计预算(100.00万元)";
const DEFAULT_WARNING_LEVEL = "红色预警";
const DEFAULT_WARNING_LEVEL_COLOR = "#F5222D";
const DEFAULT_WARNING_DATE = "2025-10-10";
const DEFAULT_HANDLER = "孙娴茹";

function getWarningLevelColor(levelCode?: number) {
	if (levelCode === 2) {
		return "#FFD900";
	}
	if (levelCode === 3) {
		return "#FF7D00";
	}
	return DEFAULT_WARNING_LEVEL_COLOR;
}

function extractProjectName(orgPath?: string) {
	if (!orgPath) {
		return project.projName;
	}
	const parts = orgPath
		.split(">")
		.map((item) => item.trim())
		.filter(Boolean);
	return parts.length ? parts[parts.length - 1] : project.projName;
}

export interface MatchingProjsProps {
	/* 项目编号 */
	projCode: string;

	/* 项目名称 */
	projName: string;

	/* 项目匹配评分 */
	proScore: string;
	tagName: string;
}

export default function AIDrawer(props: AiModalProps) {
	const { open, setOpen, detail } = props;
	const [analysisProj, setAnalysisProj] = useState<MatchingsProjectsRes>(); // 分析项目
	const [matchingProjList, setMatchingProjList] = useState<MatchingProjsProps[]>([]); // 匹配项目列表
	const simulatorRef = useRef<any>(null);
	const [progress, setProgress] = useState(0);
	const [progressFail, setProgressFail] = useState(false);
	const [loading, setLoading] = useState(false);
	const [showTopBtn, setShowTopBtn] = useState(false);
	const [tab, setTab] = useState<MatchingProjsProps>();
	const [tabList, setTabList] = useState<any[]>([]);
	const [aiData, setAiData] = useState<any[]>([]);
	const abortControllerRef = useRef<AbortController | null>(null);
	const contentRef = useRef<any>(null);
	const orgPath = detail?.orgPath || "-";
	const warningContent = detail?.warningContent || "-";
	const warningTriggerCondition =
		detail?.warningTriggerCondition || DEFAULT_WARNING_TRIGGER_CONDITION;
	const latestWarningLevel = detail?.level || detail?.latestWarningLevel || DEFAULT_WARNING_LEVEL;
	const levelCode = Number(detail?.levelCode) || 4;
	const latestWarningLevelColor =
		detail?.latestWarningLevelColor || getWarningLevelColor(levelCode);
	const firstWarningDate = detail?.firstWarningDate || DEFAULT_WARNING_DATE;
	const levelOneHandler = detail?.levelOneHandler || DEFAULT_HANDLER;
	const levelTwoHandler = detail?.levelTwoHandler || DEFAULT_HANDLER;
	const levelThreeHandler = detail?.levelThreeHandler || DEFAULT_HANDLER;
	const analysisProjectName = extractProjectName(detail?.orgPath || "");

	// AI结果匹配
	const handleFinish = (matchingProjList: MatchingProjsProps[]) => {
		if (matchingProjList?.length === 0) return;

		simulatorRef.current?.reset();
		simulatorRef?.current?.start();
		setProgressFail(false);
		setTabList(matchingProjList);
		setTab(matchingProjList?.[0]);
		setAnalysisProj({
			...project,
			projName: analysisProjectName,
		});
		setLoading(true);
		setAiData([]);
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		const controller = new AbortController();
		abortControllerRef.current = controller;
		getAIDataWithProgress(
			{
				noBenchmarkProjectCode: analyseCode,
				benchmarkProjectCodeList: matchingProjList?.map((item) => item.projCode),
				t: Date.now(),
			},
			{ signal: controller.signal },
		).then(({ data }: any) => {
			if (data) {
				setAiData(data);
				simulatorRef.current?.complete();
				setTimeout(() => {
					setLoading(false);
				}, 1000);
			} else {
				simulatorRef?.current?.stop();
				setProgressFail(true);
			}
		});
	};

	// 切换tab
	const changeTab = (key: string) => {
		const _tab = matchingProjList?.find((item) => item.projCode === key);
		setTab(_tab);
	};

	// 取消请求
	const cancelProgress = () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		simulatorRef.current?.stop();
		setLoading(false);
		setProgress(0);
	};

	// 关闭按钮
	const onClose = () => {
		setOpen(false);
	};

	const goTop = () => {
		contentRef?.current?.scrollTo({ top: 0, behavior: "smooth" }); // 平滑滚动
	};

	useEffect(() => {
		// 初始化进度条
		simulatorRef.current = new ProgressSimulator(setProgress);
		return () => {
			simulatorRef.current?.stop();
		};
	}, []);

	useEffect(() => {
		getAllMatchingProjs(analyseCode).then(({ data }: any) => {
			if (data?.length) {
				const list = data?.map((item: MatchingsProjectsRes) => {
					return {
						...item,
						tagName: `${item.projName} (匹配度${Number(item?.proScore)?.toFixed(2)}分)`,
					};
				});
				setMatchingProjList(list);
				handleFinish(list);
			} else {
				setMatchingProjList([]);
			}
		});
	}, []);

	useEffect(() => {
		setAnalysisProj((prev) => {
			if (!prev) {
				return prev;
			}
			return {
				...prev,
				projName: analysisProjectName,
			};
		});
	}, [analysisProjectName]);

	// 滚动监听
	useEffect(() => {
		const element = contentRef.current;
		if (!element) return;

		const handleScroll = debounce(() => {
			setShowTopBtn(element.scrollTop > 700);
		}, 100);

		element.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			element.removeEventListener("scroll", handleScroll);
		};
	}, [tab]);

	return (
		<Drawer
			closable={false}
			onClose={onClose}
			open={open}
			width="60%"
			height="100vh"
			size="large"
			title={<></>}
			styles={{
				body: {
					overflow: "visible",
					padding: 0,
					backgroundImage: `url(${Bg})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
				},
				header: { padding: 0 },
				content: { overflow: "visible" },
			}}
		>
			{loading ? (
				<MatchingProgress
					className="top-[320px]"
					progress={progress}
					cancel={cancelProgress}
					progressFail={progressFail}
				/>
			) : (
				<></>
			)}
			<CloseBtn onClose={onClose} />
			{showTopBtn ? <GOTopBtn goTop={goTop} /> : <></>}
			<div
				ref={contentRef}
				className="scrollbar relative h-full w-full overflow-x-hidden overflow-y-scroll p-6 pt-0"
			>
				<div className="my-6 w-full text-center">
					<span className="gradient-text text-[26px]">
						“{analysisProjectName}
						”人效提升AI建议方案
					</span>
				</div>
				<SectionTitle title={<span className="text-base font-bold">预警内容</span>} />
				<Descriptions
					className="m-5"
					size="small"
					column={2}
					styles={{
						label: { width: 120, display: "flex", justifyContent: "flex-end" },
						content: { wordBreak: "break-word" },
					}}
					colon={false}
				>
					<Descriptions.Item label="所属组织">
						<Typography.Text ellipsis={{ tooltip: true }}>{orgPath}</Typography.Text>
					</Descriptions.Item>
					<Descriptions.Item label="预警内容">{warningContent}</Descriptions.Item>
					<Descriptions.Item label="预警触发条件">
						<Typography.Text ellipsis={{ tooltip: true }}>
							{warningTriggerCondition}
						</Typography.Text>
					</Descriptions.Item>
					<Descriptions.Item label="最新预警等级">
						<Badge color={latestWarningLevelColor} text={latestWarningLevel} />
					</Descriptions.Item>
					<Descriptions.Item label="首次预警日期">{firstWarningDate}</Descriptions.Item>
					<Descriptions.Item label="一级处理人">{levelOneHandler}</Descriptions.Item>
					<Descriptions.Item label="二级处理人">{levelTwoHandler}</Descriptions.Item>
					<Descriptions.Item label="三级处理人">{levelThreeHandler}</Descriptions.Item>
				</Descriptions>
				<AIContent
					analysisProj={analysisProj as any}
					tabList={tabList}
					proj={tab as any}
					aiData={aiData}
					changeTab={changeTab}
					pdfBizType={PdfBizType.EFFICIENCY_CONTROL_WARNING_CENTER}
					warningInfo={{
						orgPath,
						warningContent,
						warningTriggerCondition,
						latestWarningLevel,
						firstWarningDate,
						levelOneHandler,
						levelTwoHandler,
						levelThreeHandler,
					}}
				/>
			</div>
		</Drawer>
	);
}
