import type {
	ComparedProjCodeRes,
	MatchingsProjectsRes,
} from "#src/api/efficiency-control/analysis/aiMoal";
import {
	getAIComparedProjectDetail,
	getAIDataWithProgress,
	getAllMatchingProjs,
	getFuzzyAIMatchingProjects,
} from "#src/api/efficiency-control/analysis/aiMoal";
import { createPdfExportTask, PdfBizType } from "#src/api/file/export-task";
import notFind from "#src/assets/notfind@2x.png";
import Backtop from "#src/assets/svg/backtop.svg?react";
import { BasicButton, SectionTitle } from "#src/components";
import { CloseOutlined, UploadOutlined } from "@ant-design/icons";

import {
	Button,
	Col,
	Drawer,
	Form,
	message,
	Progress,
	Row,
	Select,
	Table,
	Tabs,
	theme,
} from "antd";

import DOMPurify from "dompurify";
import {
	debounce,
	find,
	flatMap,
	get,
	isArray,
	isBoolean,
	isNil,
	isNumber,
	isString,
	last,
	map,
	toPairs,
	toString,
	trim,
} from "lodash-es";
import { marked } from "marked";
import { memo, useEffect, useRef, useState } from "react";
import {
	basicMap,
	deliverMap,
	equipmentMap,
	getBasicInfo,
	getColumns,
	getCompareColumns,
	getStaffInfo,
	operatingMetricsMap,
	serviceContentMap,
} from "./config";
import ProgressSimulator from "./ProgressSimulator";
import "./index.css";

interface AiModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
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

interface EfficiencyAnalysisPdfSection {
	title: string;
	content?: string;
	metrics?: {
		label: string;
		value?: string;
		unit?: string;
		compareText?: string;
	}[];
	tables?: {
		title: string;
		description?: string;
		columns: {
			key: string;
			label: string;
		}[];
		rows: Record<string, unknown>[];
	}[];
}

interface WarningCenterPdfInfo {
	orgPath?: string;
	warningContent?: string;
	warningTriggerCondition?: string;
	latestWarningLevel?: string;
	firstWarningDate?: string;
	levelOneHandler?: string;
	levelTwoHandler?: string;
	levelThreeHandler?: string;
}

interface PdfCellItem {
	label?: string;
	value?: string;
}

const MATCHING_DIMENSION_CONFIG = [
	{ title: "基本信息", detailKey: "basicInfo", labelMap: basicMap },
	{ title: "交付信息", detailKey: "deliverInfo", labelMap: deliverMap },
	{ title: "服务内容", detailKey: "serviceInfo", labelMap: serviceContentMap },
	{ title: "运营指标", detailKey: "operationInfo", labelMap: operatingMetricsMap },
] as const;

const TEAM_FIELD_CONFIG = [
	{ label: "编制人数", field: "authorizedNum" },
	{ label: "在职人数", field: "onstaffNum" },
	{ label: "新老配比", field: "newOldRatio" },
	{ label: "男女配比", field: "sexRatio" },
	{ label: "年龄段", field: "ageRatio" },
	{ label: "学历分布", field: "eduRatio" },
	{ label: "稳定性", field: "stability" },
] as const;

function toDisplayValue(value: unknown): string {
	if (isNil(value) || value === "") {
		return "-";
	}
	if (isNumber(value) || isBoolean(value)) {
		return String(value);
	}
	if (isString(value)) {
		return value;
	}
	if (isArray(value)) {
		return value.length ? map(value, (item) => toDisplayValue(item)).join("，") : "-";
	}
	if (typeof value === "object") {
		return toPairs(value as Record<string, unknown>)
			.map(([key, val]) => `${key}：${toDisplayValue(val)}`)
			.join("\n");
	}
	return "-";
}

function buildItemsByMap(
	data: Record<string, unknown> | undefined,
	labelMap: Record<string, string>,
): PdfCellItem[] {
	return toPairs(labelMap).map(([label, key]) => ({
		label,
		value: toDisplayValue(get(data, key)),
	}));
}

function buildTeamItems(value: unknown): PdfCellItem[] {
	if (isString(value)) {
		return [{ value: value || "-" }];
	}
	if (!value || typeof value !== "object") {
		return [{ value: "-" }];
	}
	const teamInfo = value as Record<string, unknown>;
	const totalLine = isNil(teamInfo["共计"])
		? []
		: [{ label: "共计", value: toDisplayValue(teamInfo["共计"]) }];
	const restLines = toPairs(teamInfo)
		.filter(([key]) => key !== "共计")
		.map(([key, val]) => ({ label: key, value: toDisplayValue(val) }));
	const lines = [...totalLine, ...restLines];
	return lines.length ? lines : [{ value: "-" }];
}

function normalizeAiText(raw: unknown) {
	if (isNil(raw)) {
		return "";
	}
	return trim(toString(raw).replace(/\r\n/g, "\n"));
}

function stripSuggestPrefix(text: string) {
	const anchor = "面向非标杆项目的改进建议";
	const idx = text.lastIndexOf(anchor);
	if (idx === -1) {
		return text;
	}
	return text.slice(idx + anchor.length).trim();
}

function buildDimensionRows(
	analysisDetail: ComparedProjCodeRes,
	benchmarkDetail: ComparedProjCodeRes,
	dimensionConfig: ReadonlyArray<{
		title: string;
		detailKey: string;
		labelMap: Record<string, string>;
	}>,
) {
	return map(dimensionConfig, ({ title, detailKey, labelMap }) => ({
		dimension: title,
		analysisValue: buildItemsByMap(
			get(analysisDetail, detailKey) as Record<string, unknown>,
			labelMap,
		),
		benchmarkValue: buildItemsByMap(
			get(benchmarkDetail, detailKey) as Record<string, unknown>,
			labelMap,
		),
	}));
}

function buildTeamRows(analysisDetail: ComparedProjCodeRes, benchmarkDetail: ComparedProjCodeRes) {
	return flatMap(TEAM_FIELD_CONFIG, ({ label, field }) => {
		const titleRow: Record<string, unknown> = {
			dimension: "团队配置",
			analysisValue: [{ label, value: "" }],
			benchmarkValue: [{ label, value: "" }],
			_mergeAcross: true,
		};
		return [
			titleRow,
			{
				dimension: "团队配置",
				analysisValue: buildTeamItems(get(analysisDetail, ["teamInfo", field])),
				benchmarkValue: buildTeamItems(get(benchmarkDetail, ["teamInfo", field])),
			},
		];
	});
}

function withDimensionRowspan(rows: Record<string, unknown>[], dimensionKey: string) {
	const mergedRows = rows.map((row) => ({ ...row }));
	let i = 0;
	while (i < mergedRows.length) {
		const currentDimension = mergedRows[i]?.[dimensionKey];
		let span = 1;
		let j = i + 1;
		while (j < mergedRows.length && mergedRows[j]?.[dimensionKey] === currentDimension) {
			span += 1;
			j += 1;
		}
		mergedRows[i]._dimensionShow = true;
		mergedRows[i]._dimensionRowspan = span;
		for (let k = i + 1; k < j; k += 1) {
			mergedRows[k]._dimensionShow = false;
			mergedRows[k]._dimensionRowspan = 0;
		}
		i = j;
	}
	return mergedRows;
}

export default function AiModal(props: AiModalProps) {
	const { open, setOpen } = props;
	const [form] = Form.useForm();
	const [analysisProjList, setAnalysisProjList] = useState<MatchingsProjectsRes[]>([]); // 分析项目列表
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

	const analyseCode = Form.useWatch("analyseCode", form);

	const abortControllerRef = useRef<AbortController | null>(null);
	const contentRef = useRef<any>(null);

	// 模糊搜索
	const getAnalysisData = async (value: string) => {
		const { data }: any = await getFuzzyAIMatchingProjects({
			projName: value,
			isBenchmark: "否",
		});
		if (data?.length) {
			setAnalysisProjList(data);
		} else {
			setAnalysisProjList([]);
		}
	};

	// 分析项目（防抖）
	const handleSearch = debounce((value: string) => {
		if (!value) return;
		getAnalysisData(value);
	}, 500);

	// AI结果匹配
	const handleFinish = () => {
		if (matchingProjList?.length === 0) return;
		simulatorRef.current?.reset();
		simulatorRef?.current?.start();
		setProgressFail(false);
		setTabList(matchingProjList);
		setTab(matchingProjList?.[0]);
		setAnalysisProj(analysisProjList?.find((item) => item.projCode === analyseCode));
		setLoading(true);
		setAiData([]);
		// setResultTableData([]);
		// setCompareTableData([]);
		// setAnalysisProjectDetail(null);
		// setBenchmarkProjectDetail(null);
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
		getAnalysisData("");
		return () => {
			simulatorRef.current?.stop();
		};
	}, []);

	useEffect(() => {
		if (!analyseCode) return;

		getAllMatchingProjs(analyseCode).then(({ data }: any) => {
			if (data?.length) {
				const list = data?.map((item: MatchingsProjectsRes) => {
					return {
						...item,
						tagName: `${item.projName} (匹配度${Number(item?.proScore)?.toFixed(2)}分)`,
					};
				});
				setMatchingProjList(list);

				form.setFieldValue(
					"matchingCode",
					data?.map((item: MatchingsProjectsRes) => item.projCode),
				);
			} else {
				setMatchingProjList([]);
				form.setFieldValue("matchingCode", []);
			}
		});
	}, [analyseCode]);

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
				body: { overflow: "visible", paddingTop: 0 },
				header: { padding: 0 },
				content: { overflow: "visible" },
			}}
		>
			{loading ? (
				<MatchingProgress
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
				className="scrollbar relative h-full w-full overflow-x-hidden overflow-y-scroll"
			>
				<div className="ai-modal-header"></div>
				<Form
					className="mb-4 w-full border-b pb-4"
					form={form}
					layout="inline"
					colon={false}
					// labelCol={{ span: 6 }}
					wrapperCol={{ span: 18 }}
					onFinish={handleFinish}
				>
					<Row style={{ width: "100%" }}>
						<Col span={11}>
							<Form.Item
								label="分析项目"
								name="analyseCode"
								rules={[{ required: true, message: "请选择分析项目" }]}
							>
								<Select
									showSearch
									allowClear
									placeholder="请搜索"
									filterOption={false}
									onSearch={handleSearch}
									options={analysisProjList}
									fieldNames={{ value: "projCode", label: "projName" }}
								></Select>
							</Form.Item>
						</Col>
						<Col span={11}>
							<Form.Item label="标杆项目" name="matchingCode">
								<Select
									disabled
									placeholder="自动匹配"
									className="matchingCode-select"
									mode="tags"
									open={false}
									suffixIcon={null}
									style={{ width: "100%" }}
									options={matchingProjList as any[]}
									fieldNames={{ value: "projCode", label: "tagName" }}
								/>
							</Form.Item>
						</Col>
						<Col span={2}>
							<Form.Item>
								<Button type="primary" htmlType="submit">
									结果匹配
								</Button>
							</Form.Item>
						</Col>
					</Row>
				</Form>
				{analysisProj && tab && tabList?.length > 0 ? (
					<AIContent
						analysisProj={analysisProj}
						tabList={tabList}
						proj={tab}
						aiData={aiData}
						changeTab={changeTab}
					/>
				) : (
					<NoneMatchingProj />
				)}
			</div>
		</Drawer>
	);
}
export const AIContent = memo(
	(props: {
		analysisProj: MatchingsProjectsRes;
		tabList: ComparedProjCodeRes[];
		proj: MatchingProjsProps;
		aiData: any[];
		changeTab: (key: string) => void;
		pdfBizType?: PdfBizType;
		warningInfo?: WarningCenterPdfInfo;
	}) => {
		const {
			analysisProj,
			proj,
			tabList,
			aiData,
			changeTab,
			pdfBizType = PdfBizType.EFFICIENCY_CONTROL_ANALYSIS,
			warningInfo,
		} = props;
		const [compareTableData, setCompareTableData] = useState<any[]>([]);
		const [resultTableData, setResultTableData] = useState<any[]>([]);

		const [analysisProjectDetail, setAnalysisProjectDetail] =
			useState<ComparedProjCodeRes | null>(null);
		const [benchmarkProjectDetail, setBenchmarkProjectDetail] =
			useState<ComparedProjCodeRes | null>(null);
		const compareRef = useRef<any>(null);
		const suggestRef = useRef<any>(null);
		useEffect(() => {
			if (!aiData?.length) return;
			const data: any = aiData?.find((item) => item.projCode === proj.projCode);
			const proSuggestResult: any = marked.parse(
				last(data?.proSuggestResult?.split("面向非标杆项目的改进建议  \n")) || "",
			);
			const compareResult: any = marked.parse(data?.proResult || "");
			if (compareRef?.current && suggestRef?.current) {
				compareRef.current.innerHTML = DOMPurify.sanitize(compareResult);
				suggestRef.current.innerHTML = DOMPurify.sanitize(proSuggestResult);
			}
		}, [aiData, proj]);

		const getData = async () => {
			if (analysisProj && proj && tabList?.length > 0) {
				const { data: analysisprojData }: any = await getAIComparedProjectDetail(
					analysisProj.projCode,
				); // 分析项目数据
				const { data: markProjData }: any = await getAIComparedProjectDetail(proj.projCode); // 标杆项目数据
				setAnalysisProjectDetail(analysisprojData ?? null);
				setBenchmarkProjectDetail(markProjData ?? null);

				const list = TEAM_FIELD_CONFIG.map(({ label: title, field }) => {
					return [
						{
							dimension: "团队配置",
							title: true,
							analysisValue: (
								<div className="flex h-auto w-[100px] justify-end text-sm text-[#000000]">
									{title}
								</div>
							),
							benchmarkValue: "",
						},
						{
							dimension: "团队配置",
							title: false,
							analysisValue: getStaffInfo(analysisprojData?.teamInfo[field]),
							benchmarkValue: getStaffInfo(markProjData?.teamInfo[field]),
						},
					];
				});
				setResultTableData([
					{
						dimension: "基本信息",
						analysisValue: getBasicInfo(analysisprojData?.basicInfo || {}, basicMap),
						benchmarkValue: getBasicInfo(markProjData?.basicInfo || {}, basicMap),
					},
					{
						dimension: "交付信息",
						analysisValue: getBasicInfo(
							analysisprojData?.deliverInfo || {},
							deliverMap,
						),
						benchmarkValue: getBasicInfo(markProjData?.deliverInfo || {}, deliverMap),
					},
					{
						dimension: "服务内容",
						analysisValue: getBasicInfo(
							analysisprojData?.serviceInfo || {},
							serviceContentMap,
						),
						benchmarkValue: getBasicInfo(
							markProjData?.serviceInfo || {},
							serviceContentMap,
						),
					},
					{
						dimension: "运营指标",
						analysisValue: getBasicInfo(
							analysisprojData?.operationInfo || {},
							operatingMetricsMap,
						),
						benchmarkValue: getBasicInfo(
							markProjData?.operationInfo || {},
							operatingMetricsMap,
						),
					},
				]);

				setCompareTableData([
					{
						dimension: "运营指标",
						analysisValue: getBasicInfo(
							analysisprojData?.operationInfo || {},
							operatingMetricsMap,
						),
						benchmarkValue: getBasicInfo(
							markProjData?.operationInfo || {},
							operatingMetricsMap,
						),
					},
					...list?.flat(),
					{
						dimension: "智能化设备",
						analysisValue: getBasicInfo(
							analysisprojData?.intelligentDeviceInfo || {},
							equipmentMap,
						),
						benchmarkValue: getBasicInfo(
							markProjData?.intelligentDeviceInfo || {},
							equipmentMap,
						),
					},
				]);
			} else {
				setAnalysisProjectDetail(null);
				setBenchmarkProjectDetail(null);
			}
		};

		useEffect(() => {
			getData();
		}, [analysisProj, proj]);

		const buildPdfSnapshot = () => {
			if (!analysisProj || !proj || !analysisProjectDetail || !benchmarkProjectDetail) {
				return null;
			}

			const analysisColumn = `分析项目：${analysisProj.projName}`;
			const benchmarkColumn = `标杆项目：${proj.tagName || proj.projName}`;
			const tableColumns = [
				{ key: "dimension", label: "对比维度" },
				{ key: "analysisValue", label: analysisColumn },
				{ key: "benchmarkValue", label: benchmarkColumn },
			];

			const matchingRows = buildDimensionRows(
				analysisProjectDetail,
				benchmarkProjectDetail,
				MATCHING_DIMENSION_CONFIG,
			);
			const mergedMatchingRows = withDimensionRowspan(matchingRows, "dimension");

			const teamRows = buildTeamRows(analysisProjectDetail, benchmarkProjectDetail);

			const diffRows = [
				...buildDimensionRows(analysisProjectDetail, benchmarkProjectDetail, [
					{
						title: "运营指标",
						detailKey: "operationInfo",
						labelMap: operatingMetricsMap,
					},
				]),
				...teamRows,
				...buildDimensionRows(analysisProjectDetail, benchmarkProjectDetail, [
					{
						title: "智能化设备",
						detailKey: "intelligentDeviceInfo",
						labelMap: equipmentMap,
					},
				]),
			];
			const mergedDiffRows = withDimensionRowspan(diffRows, "dimension");

			const tabAiData = find(aiData, (item) => item?.projCode === proj.projCode);
			const compareText = normalizeAiText(tabAiData?.proResult);
			const suggestText = stripSuggestPrefix(normalizeAiText(tabAiData?.proSuggestResult));

			const sections: EfficiencyAnalysisPdfSection[] = [
				{
					title: "一、标杆项目对比",
					tables: [
						{
							description: `AI助手基于本项目的以下标签，匹配到相似的成熟标杆项目: ${proj.projName}，匹配结果如下:`,
							title: "1、标杆项目匹配结果",
							columns: tableColumns,
							rows: mergedMatchingRows,
						},
						{
							title: "2、差异对比",
							columns: tableColumns,
							rows: mergedDiffRows,
						},
					],
				},
			];

			if (compareText) {
				sections.push({
					title: "二、本项目与标杆项目AI对比",
					content: compareText,
				});
			}

			if (suggestText) {
				sections.push({
					title: "三、人效提升AI处理建议",
					content: suggestText,
				});
			}

			const snapshot: Record<string, any> = {
				analysisProjectName: analysisProj.projName,
				sections,
			};
			if (pdfBizType === PdfBizType.EFFICIENCY_CONTROL_WARNING_CENTER && warningInfo) {
				snapshot.warningInfo = warningInfo;
			}
			return snapshot;
		};

		const handleExport = async () => {
			const snapshot = buildPdfSnapshot();
			if (!snapshot) {
				message.warning("请先完成结果匹配并选择标杆项目");
				return;
			}
			try {
				const exportFileName = `${snapshot.analysisProjectName}人效提升AI建议方案`;
				await createPdfExportTask({
					bizType: pdfBizType,
					title: exportFileName,
					snapshot,
				});
				message.success("下载成功，请到【文件中心】-【导出中心】下载文件~");
			} catch (err) {
				const msg = err instanceof Error ? err.message : "提交导出任务失败，请稍后重试";
				message.error(msg);
			}
		};

		return (
			<>
				<Tabs
					className="ai-modal-tabs sticky top-0 z-20 h-auto bg-[#fff]"
					type="card"
					activeKey={proj?.projCode}
					onChange={changeTab}
					items={tabList.map((item: any) => {
						return {
							label: item.tagName,
							key: item.projCode,
							children: <></>,
						};
					})}
				/>

				<div className="w-full border border-t-0 p-4">
					<SectionTitle
						title={<span className="text-lg font-bold">一、标杆项目对比</span>}
					/>
					<div className="my-4 text-sm font-bold">1、标杆项目匹配结果</div>
					<div className="mb-2 text-sm">
						AI助手基于本项目的以下标签，匹配到相似的成熟标杆项目: {proj.projName}{" "}
						，匹配结果如下:
					</div>
					<Table
						className="matching-table"
						size="small"
						bordered
						dataSource={resultTableData}
						columns={getColumns(analysisProj, proj) as any[]}
						pagination={false}
					/>

					<div className="my-4 text-sm font-bold">2、差异对比</div>
					<Table
						className="matching-compare-table"
						size="small"
						bordered
						dataSource={compareTableData}
						columns={getCompareColumns(analysisProj, proj) as any[]}
						pagination={false}
					/>
					{aiData?.length ? (
						<>
							<SectionTitle
								className="my-4"
								title={
									<span className="text-lg font-bold">
										二、🎯本项目与标杆项目AI对比
									</span>
								}
							/>
							<div ref={compareRef} className="leading-8"></div>

							<SectionTitle
								className="mb-4"
								title={
									<span className="text-lg font-bold">
										三、👉人效提升AI处理建议
									</span>
								}
							/>
							<div ref={suggestRef} className="leading-8"></div>
							<div className="flex items-center justify-start gap-2">
								<BasicButton
									ghost
									type="primary"
									key="import"
									icon={<UploadOutlined />}
									style={{ height: 28 }}
									onClick={handleExport}
								>
									<span className="text-xs">导出</span>
								</BasicButton>
								{/* <ThumbUp
							style={{ fill: thumbUpClick ? "#0075FF" : thumbUpHover ? "#5ca7ff" : "#606266" }}
							className="cursor-pointer"
							onClick={() => setThumbUpClick(!thumbUpClick)}
							onMouseEnter={() => setThumbUpHover(true)}
							onMouseLeave={() => setThumbUpHover(false)}
						/>
						<ThumbUp
							style={{ fill: thumbDownClick ? "#0075FF" : thumbDownHover ? "#5ca7ff" : "#606266" }}
							className="rotate-180 cursor-pointer"
							onClick={() => setThumbDownClick(!thumbDownClick)}
							onMouseEnter={() => setThumbDownHover(true)}
							onMouseLeave={() => setThumbDownHover(false)}
						/> */}
							</div>
						</>
					) : (
						<></>
					)}
				</div>
			</>
		);
	},
);

// 加载进度条
export function MatchingProgress({
	progress,
	cancel,
	progressFail,
}: {
	progress: number;
	cancel: () => void;
	progressFail: boolean;
	className?: string;
}) {
	const { token } = theme.useToken();

	return (
		<div
			className="absolute top-[266px] z-50 h-auto w-[400px] rounded bg-[#fff] p-3"
			style={{
				left: "calc(50% - 200px)",
				boxShadow:
					"0 8px 10px -5px #00000014,0 16px 24px 2px #0000000A,0 6px 30px 5px #0000000D,0.5px 0 0 0 #DCDCDC inset, -0.5px 0 0 0 #DCDCDC inset,0 -0.5px 0 0 #DCDCDC inset, 0 0.5px 0 0 #DCDCDC inset",
			}}
		>
			<div className="flex h-auto w-full items-center justify-between">
				<span className="text-[14px] text-[#606266]">
					正在匹配分析，数据量较大，请稍等~
				</span>
				<span
					className="cursor-pointer text-[14px]"
					style={{
						color: token.colorPrimary,
					}}
					onClick={cancel}
				>
					取消
				</span>
			</div>
			<Progress
				percent={progress}
				className="mt-2"
				status={progressFail ? "exception" : progress === 100 ? "success" : "active"}
			/>
		</div>
	);
}
// 没有匹配到项目的兜底
export function NoneMatchingProj() {
	return (
		<div className="flex h-3/5 flex-1 flex-col items-center justify-center">
			<img src={notFind} className="h-[196px] w-[196px]" />
			<span className="text-4 mb-4 text-[#909399]">暂无数据</span>
			<span className="text-4 text-[#323233]">请选择“分析项目”，再进行“结果匹配”</span>
		</div>
	);
}

// 关闭按钮
export function CloseBtn({ onClose }: { onClose: () => void }) {
	const { token } = theme.useToken();
	return (
		<div
			className={`z-21 absolute -left-[40px] top-[76px] h-10 w-10 rounded-sm bg-[${token.colorPrimary}] flex cursor-pointer items-center justify-center`}
			onClick={onClose}
		>
			<CloseOutlined className="text-[18px] font-bold text-[#fff]" />
		</div>
	);
}

// 回顶部按钮
export function GOTopBtn({ goTop }: { goTop: () => void }) {
	const [hover, setHover] = useState(false);
	return (
		<div
			className="absolute bottom-[100px] right-4 z-30 flex h-auto w-auto cursor-pointer flex-col items-center justify-center gap-1 rounded-[24px] px-1.5 py-2"
			style={{
				boxShadow: "0px 0px 4px 0px #0035904D",
				backgroundColor: hover ? "#5ca7ff" : "#0075FF",
			}}
			onClick={goTop}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
		>
			<Backtop className="text-[12px] text-[#fff]" />
			<span className="text-[12px] text-[#fff]">顶部</span>
		</div>
	);
}
