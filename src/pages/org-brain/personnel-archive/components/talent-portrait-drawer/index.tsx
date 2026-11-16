/**
 * 人才画像抽屉。
 * 负责聚合画像数据、档案基础信息以及左侧标签类型树交互。
 *
 * @author 王善能
 * @date 2026-04-16
 */

import type {
	PersonnelArchiveTagItem,
	RadarDetailData,
	TalentArchiveAssessmentItem,
	TalentArchiveBasicInfo,
	TalentArchiveData,
	TalentArchiveEducationItem,
	TalentPortraitEducationDetail,
	TalentPortraitPerformanceDetail,
	TalentPortraitTagItem,
} from "#src/api/org-brain/personnel-archive";
import type { DataNode } from "antd/es/tree";
import { fetchRadarDetail, fetchTalentArchive } from "#src/api/org-brain/personnel-archive";
import EmptyDataSvg from "#src/assets/svg/empty-data.svg";
import { SectionTitle } from "#src/components";
import { useDict } from "#src/hooks";
import { PERSONNEL_ARCHIVE_DICT_KEYS } from "#src/pages/personnel-archive/config";
import { TAG_DICT_KEYS } from "#src/pages/tag-management/config";
import { buildDictTree } from "#src/pages/tag-management/utils";
import { CloseOutlined, SearchOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useBoolean } from "ahooks";
import { Drawer, Empty, Input, Spin, Tree } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AbilityModelChart } from "./AbilityModelChart";
import { DiscreteTagsSection } from "./DiscreteTagsSection";
import { EducationDetailModal } from "./EducationDetailModal";
import { PerformanceDetailModal } from "./PerformanceDetailModal";
import { PortraitBasicInfoSection } from "./PortraitBasicInfoSection";
import { QualificationDetailDrawer } from "./QualificationDetailDrawer";
import { RadarChart } from "./RadarChart";

const VISIBLE_TAG_VALUE = "1";
const INVISIBLE_TAG_VALUE = "0";
const SERVICE_HEART_MODULE_VALUE = "01";
const BODY_FORCE_MODULE_VALUE = "02";
const OPERATION_MODULE_VALUE = "03";
const MARKET_MODULE_VALUE = "04";
const INTELLIGENCE_MODULE_VALUE = "05";
const DISCRETE_MODULE_VALUE = "06";
const ONE_HEART_FOUR_FORCES_MODULE_VALUES = new Set([
	SERVICE_HEART_MODULE_VALUE,
	BODY_FORCE_MODULE_VALUE,
	OPERATION_MODULE_VALUE,
	MARKET_MODULE_VALUE,
	INTELLIGENCE_MODULE_VALUE,
]);

// 搜索标签树时保留命中节点及其祖先节点。
function filterTreeByTitle(nodes: DataNode[], keyword: string): DataNode[] {
	const k = keyword.trim().toLowerCase();
	if (!k) {
		return nodes;
	}

	function match(node: DataNode): boolean {
		const title = (node.title as string) ?? "";
		return String(title).toLowerCase().includes(k);
	}

	function filter(nodes: DataNode[]): DataNode[] {
		const result: DataNode[] = [];
		for (const node of nodes) {
			const children = filter((node.children ?? []) as DataNode[]);
			const selfMatch = match(node);
			const childMatch = children.length > 0;
			if (selfMatch || childMatch) {
				result.push({
					...node,
					children: children.length ? children : undefined,
				});
			}
		}
		return result;
	}

	return filter(nodes);
}

function getParentKey(key: React.Key, tree: DataNode[]): React.Key | undefined {
	let parentKey: React.Key | undefined;
	for (let i = 0; i < tree.length; i++) {
		const node = tree[i];
		if (node.children) {
			if (node.children.some((item) => item.key === key)) {
				parentKey = node.key;
			} else if (getParentKey(key, node.children)) {
				parentKey = getParentKey(key, node.children);
			}
		}
	}
	return parentKey;
}

// 勾选和搜索都依赖祖先节点展开，这里统一收敛祖先查找逻辑。
function getAllParentKeys(key: React.Key, tree: DataNode[]): React.Key[] {
	const parentKeys: React.Key[] = [];
	let currentKey: React.Key | undefined = key;

	while (currentKey) {
		const parentKey = getParentKey(currentKey, tree);
		if (parentKey) {
			parentKeys.push(parentKey);
			currentKey = parentKey;
		} else {
			break;
		}
	}

	return parentKeys;
}

function generateList(data: DataNode[]): Array<{ key: React.Key; title: string }> {
	const dataList: Array<{ key: React.Key; title: string }> = [];
	for (let i = 0; i < data.length; i++) {
		const node = data[i];
		const { key } = node;
		dataList.push({ key, title: String(node.title || "") });
		if (node.children) {
			dataList.push(...generateList(node.children));
		}
	}
	return dataList;
}

/**
 * 将标签中心业务类别 Cascader 结构转换为 Tree 组件结构。
 * Tree 节点 key 固定使用字典值，便于和人员标签 businessCategory 做默认勾选与筛选匹配。
 *
 * @param options 业务类别级联选项
 * @returns 标签类型树节点
 */
function convertBusinessCategoryOptionsToTree(
	options: Array<{ label: string; value: string; children?: any[] }>,
): DataNode[] {
	return options.map((option) => ({
		key: option.value,
		title: option.label,
		children: option.children?.length
			? convertBusinessCategoryOptionsToTree(option.children)
			: undefined,
	}));
}

/**
 * 提取人员标签中的业务类别编码。
 * 兼容后端未来返回数组的场景，当前 eff_tag.business_category 为单值字符串。
 *
 * @param tags 人员标签列表
 * @returns 去重后的业务类别编码
 */
function extractBusinessCategoryValues(tags: TalentPortraitTagItem[]): string[] {
	const set = new Set<string>();
	for (const tag of tags) {
		const { businessCategory } = tag;
		if (!businessCategory) {
			continue;
		}

		if (Array.isArray(businessCategory)) {
			for (const value of businessCategory) {
				if (value) {
					set.add(String(value));
				}
			}
		} else {
			set.add(String(businessCategory));
		}
	}
	return Array.from(set).sort();
}

/**
 * 将后端人员档案标签转换为人才画像标签展示模型。
 * 标签数据来自同一个人员档案接口，避免画像抽屉重复请求或使用 mock 数据。
 *
 * @param tags 人员档案标签
 * @returns 人才画像标签
 */
function normalizePersonnelTags(tags: PersonnelArchiveTagItem[]): TalentPortraitTagItem[] {
	return tags.map((tag) => ({
		tagId: String(tag.tagId),
		tagName: tag.tagName,
		tagValue: tag.tagValue,
		businessCategory: tag.businessCategory,
		tagVisibility: tag.tagVisibility,
		tagDistributionModule: tag.tagDistributionModule,
	}));
}

interface DictScoreItem {
	dictLabel: string;
	dictValue: string;
}

function normalizeText(value?: string | null): string {
	return value?.replace(/\s+/g, "").toLowerCase() ?? "";
}

function findBestMatchedDictItem(
	label: string | undefined,
	dictItems: DictScoreItem[],
): DictScoreItem | undefined {
	const normalizedLabel = normalizeText(label);
	if (!normalizedLabel) {
		return undefined;
	}

	return (
		dictItems.find((item) => normalizeText(item.dictLabel) === normalizedLabel) ??
		dictItems.find((item) => {
			const normalizedDictLabel = normalizeText(item.dictLabel);
			return (
				normalizedLabel.includes(normalizedDictLabel) ||
				normalizedDictLabel.includes(normalizedLabel)
			);
		})
	);
}

function parseScore(value?: string): number {
	const score = Number(value);
	return Number.isFinite(score) ? score : 0;
}

function getDateValue(dateText?: string): number {
	if (!dateText) {
		return Number.NaN;
	}

	const parsed = dayjs(dateText, ["YYYY-MM-DD", "YYYY-MM"], true);
	return parsed.isValid() ? parsed.valueOf() : Number.NaN;
}

function getEducationWeight(
	education: TalentArchiveEducationItem | undefined,
	educationDict: DictScoreItem[],
): number {
	if (!education) {
		return 0;
	}

	return parseScore(findBestMatchedDictItem(education.degree, educationDict)?.dictValue);
}

function buildEducationDetailFromArchive(
	educations: TalentArchiveEducationItem[],
	educationDict: DictScoreItem[],
): TalentPortraitEducationDetail | null {
	if (educations.length === 0 || educationDict.length === 0) {
		return null;
	}

	const highestEducation = [...educations].sort((left, right) => {
		const scoreDiff =
			getEducationWeight(right, educationDict) - getEducationWeight(left, educationDict);
		if (scoreDiff !== 0) {
			return scoreDiff;
		}

		const endDateDiff = getDateValue(right.endDate) - getDateValue(left.endDate);
		if (!Number.isNaN(endDateDiff) && endDateDiff !== 0) {
			return endDateDiff;
		}

		return getDateValue(right.startDate) - getDateValue(left.startDate);
	})[0];

	const firstEducation = [...educations].sort((left, right) => {
		const startDateDiff = getDateValue(left.startDate) - getDateValue(right.startDate);
		if (!Number.isNaN(startDateDiff) && startDateDiff !== 0) {
			return startDateDiff;
		}

		return getDateValue(left.endDate) - getDateValue(right.endDate);
	})[0];

	const highestDegree = highestEducation?.degree ?? "";
	const highestScore = getEducationWeight(highestEducation, educationDict);

	if (!highestDegree || highestScore <= 0) {
		return null;
	}

	return {
		score: highestScore,
		scale: highestDegree,
		firstDegree: firstEducation?.degree ?? highestDegree,
		highestDegree,
		isOverseas: false,
	};
}

function extractAssessmentYear(assessment: TalentArchiveAssessmentItem): number {
	const matchedYear = assessment.year.match(/\d{4}/)?.[0];
	return matchedYear ? Number(matchedYear) : 0;
}

function getLatestAssessment(
	assessments: TalentArchiveAssessmentItem[],
): TalentArchiveAssessmentItem | null {
	if (assessments.length === 0) {
		return null;
	}

	return (
		assessments.find((item) => item.isLatest) ??
		[...assessments].sort(
			(left, right) => extractAssessmentYear(right) - extractAssessmentYear(left),
		)[0] ??
		null
	);
}

function buildPerformanceDetailFromArchive(
	assessments: TalentArchiveAssessmentItem[],
	performanceDict: DictScoreItem[],
): TalentPortraitPerformanceDetail | null {
	if (assessments.length === 0 || performanceDict.length === 0) {
		return null;
	}

	const latestAssessment = getLatestAssessment(assessments);
	if (!latestAssessment?.grade) {
		return null;
	}

	const matchedDictItem = findBestMatchedDictItem(latestAssessment.grade, performanceDict);
	const score = parseScore(matchedDictItem?.dictValue);
	if (score <= 0) {
		return null;
	}

	return {
		score,
		scale: matchedDictItem?.dictLabel || latestAssessment.grade,
	};
}

// 未配置业务类别的标签默认参与展示，避免误过滤掉通用标签。
function filterTagsByBusinessCategory(
	tags: TalentPortraitTagItem[],
	selectedBusinessCategories: string[],
): TalentPortraitTagItem[] {
	if (!selectedBusinessCategories.length) {
		return tags;
	}

	const selectedValues = selectedBusinessCategories.map((value) => String(value));

	function isBusinessCategoryMatched(value: string): boolean {
		return selectedValues.some(
			(selectedValue) =>
				value === selectedValue ||
				value.startsWith(selectedValue) ||
				selectedValue.startsWith(value),
		);
	}

	return tags.filter((tag) => {
		const { businessCategory } = tag;
		if (!businessCategory) {
			return true;
		}

		if (Array.isArray(businessCategory)) {
			return businessCategory.some((value) => isBusinessCategoryMatched(String(value)));
		}

		return isBusinessCategoryMatched(String(businessCategory));
	});
}

interface TalentPortraitDrawerProps {
	/** 是否打开 */
	open: boolean;
	/** 用户ID */
	userId: string;
	/** 外部已拿到的基础信息，优先用于画像头部展示 */
	basicInfo?: TalentArchiveBasicInfo;
	/** 外部已拿到的学历信息，优先用于学历详情展示 */
	educations?: TalentArchiveEducationItem[];
	/** 外部已拿到的绩效考核信息，优先用于绩效详情展示 */
	assessments?: TalentArchiveAssessmentItem[];
	/** 人员档案抽屉已查询到的标签，用于画像显隐分块和业务类别树默认勾选 */
	tags?: PersonnelArchiveTagItem[];
	/** 关闭回调 */
	onClose: () => void;
}

/**
 * 人才画像抽屉组件。
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function TalentPortraitDrawer({
	open,
	userId,
	basicInfo: passedBasicInfo,
	educations: passedEducations = [],
	assessments: passedAssessments = [],
	tags: passedTags = [],
	onClose,
}: TalentPortraitDrawerProps) {
	const [isEducationModalOpen, { setTrue: openEducationModal, setFalse: closeEducationModal }] =
		useBoolean(false);
	const [
		isPerformanceModalOpen,
		{ setTrue: openPerformanceModal, setFalse: closePerformanceModal },
	] = useBoolean(false);
	const [
		isQualificationDrawerOpen,
		{ setTrue: openQualificationDrawer, setFalse: closeQualificationDrawer },
	] = useBoolean(false);
	const [selectedBusinessCategories, setSelectedBusinessCategories] = useState<string[]>([]);
	const [tagTypeSearchKeyword, setTagTypeSearchKeyword] = useState("");
	const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
	const [autoExpandParent, { setTrue: enableAutoExpand, setFalse: disableAutoExpand }] =
		useBoolean(true);
	const [checkedTagTypeKeys, setCheckedTagTypeKeys] = useState<string[]>([]);

	// 查询雷达图详情聚合数据（学历、资历、绩效）
	const { data: radarDetailData, isLoading: radarDetailLoading } = useQuery<
		RadarDetailData | undefined
	>({
		queryKey: ["radar-detail", userId],
		queryFn: () => fetchRadarDetail(userId),
		enabled: open,
	});

	// 头部个人信息与画像接口解耦，单独查询档案基础信息。
	const { data: archiveData, isLoading: archiveLoading } = useQuery<
		TalentArchiveData | undefined
	>({
		queryKey: ["talent-archive-for-portrait", userId],
		queryFn: () => fetchTalentArchive(userId),
		enabled:
			open && !passedBasicInfo && !passedEducations?.length && !passedAssessments?.length,
	});

	const { data: educationDictData = [] } = useDict(PERSONNEL_ARCHIVE_DICT_KEYS.EDUCATION, {
		enabled: open,
	});

	const { data: performanceDictData = [] } = useDict(PERSONNEL_ARCHIVE_DICT_KEYS.PERFORMANCE, {
		enabled: open,
	});

	const { data: businessCategoryDictData = [] } = useDict(TAG_DICT_KEYS.BUSINESS_CATEGORY, {
		enabled: open,
	});

	const { data: tagDistributionModuleDictData = [] } = useDict(
		TAG_DICT_KEYS.TAG_USER_DISTRIBUTION_MODULE,
		{
			enabled: open,
		},
	);

	const isLoading =
		radarDetailLoading ||
		(!passedBasicInfo && !passedEducations && !passedAssessments && archiveLoading);

	const basicInfo = passedBasicInfo ?? archiveData?.basicInfo ?? null;

	// 优先使用雷达图聚合接口的数据
	const educationDetail = useMemo(() => {
		if (radarDetailData?.education) {
			return {
				score: radarDetailData.education.score,
				scale: radarDetailData.education.highLevel,
				firstDegree: radarDetailData.education.firstLevel,
				highestDegree: radarDetailData.education.highLevel,
				isOverseas: false,
			} as TalentPortraitEducationDetail;
		}
		return (
			buildEducationDetailFromArchive(
				passedEducations ?? archiveData?.educations ?? [],
				educationDictData,
			) ?? undefined
		);
	}, [radarDetailData, passedEducations, archiveData?.educations, educationDictData]);

	const performanceDetail = useMemo(() => {
		if (radarDetailData?.performance) {
			const latestAppraisal = radarDetailData.performance.appraisalList?.[0];
			return {
				score: radarDetailData.performance.score,
				scale: latestAppraisal?.grade || "",
			} as TalentPortraitPerformanceDetail;
		}
		return (
			buildPerformanceDetailFromArchive(
				passedAssessments ?? archiveData?.assessments ?? [],
				performanceDictData,
			) ?? undefined
		);
	}, [radarDetailData, passedAssessments, archiveData?.assessments, performanceDictData]);

	const qualificationDetail = useMemo(() => {
		if (radarDetailData?.qualification) {
			return {
				score: radarDetailData.qualification.score,
				obtainedCertificates: radarDetailData.qualification.obtainedCertificates.map(
					(cert) => ({
						name: cert.certName,
						level: cert.certGrade,
					}),
				),
			};
		}
		return undefined;
	}, [radarDetailData]);

	const radarData = useMemo(() => {
		if (!educationDetail || !performanceDetail || !qualificationDetail) {
			return undefined;
		}

		return {
			education: educationDetail.score,
			qualification: qualificationDetail.score,
			performance: performanceDetail.score,
		};
	}, [educationDetail, performanceDetail, qualificationDetail]);

	const businessCategoryTreeData = useMemo(
		() => convertBusinessCategoryOptionsToTree(buildDictTree(businessCategoryDictData)),
		[businessCategoryDictData],
	);

	const allTags = useMemo(() => normalizePersonnelTags(passedTags), [passedTags]);

	// 业务类别来源于当前人员实际标签，用于默认勾选对应的字典树节点。
	const businessCategoryValues = useMemo<string[]>(() => {
		return extractBusinessCategoryValues(allTags);
	}, [allTags]);

	// 抽屉打开时默认全选当前画像下已有的业务类别，保证首屏信息完整。
	useEffect(() => {
		if (!open) {
			return;
		}
		if (businessCategoryValues.length > 0) {
			setSelectedBusinessCategories(businessCategoryValues);
			setCheckedTagTypeKeys(businessCategoryValues);
		} else {
			setSelectedBusinessCategories([]);
			setCheckedTagTypeKeys([]);
		}
	}, [open, businessCategoryValues]);

	const dataList = useMemo(
		() => generateList(businessCategoryTreeData),
		[businessCategoryTreeData],
	);

	// 搜索左侧标签树时自动展开命中节点的父层级。
	useEffect(() => {
		if (!tagTypeSearchKeyword.trim()) {
			return;
		}

		const newExpandedKeys = dataList
			.map((item) => {
				if (item.title.toLowerCase().includes(tagTypeSearchKeyword.toLowerCase())) {
					return getParentKey(item.key, businessCategoryTreeData);
				}
				return null;
			})
			.filter((item, i, self): item is React.Key => !!(item && self.indexOf(item) === i));

		if (newExpandedKeys.length > 0) {
			setExpandedKeys(newExpandedKeys);
			enableAutoExpand();
		}
	}, [tagTypeSearchKeyword, dataList, businessCategoryTreeData]);

	// 默认勾选项对应的父节点需要同步展开，否则已选状态不易感知。
	useEffect(() => {
		if (!open || checkedTagTypeKeys.length === 0) {
			return;
		}

		setExpandedKeys(() => {
			const parentKeysToExpand = new Set<React.Key>();
			for (const checkedKey of checkedTagTypeKeys) {
				const parentKeys = getAllParentKeys(checkedKey, businessCategoryTreeData);
				for (const parentKey of parentKeys) {
					parentKeysToExpand.add(parentKey);
				}
			}
			return Array.from(parentKeysToExpand);
		});
	}, [open, checkedTagTypeKeys, businessCategoryTreeData]);

	// 搜索关键字只影响展示层，不修改原始标签树结构。
	const displayedTagTypeTree = useMemo(() => {
		const filteredTree = filterTreeByTitle(businessCategoryTreeData, tagTypeSearchKeyword);

		const loop = (data: DataNode[]): DataNode[] =>
			data.map((item) => {
				const strTitle = String(item.title || "");
				const index = strTitle.toLowerCase().indexOf(tagTypeSearchKeyword.toLowerCase());
				const beforeStr = strTitle.substring(0, index);
				const afterStr = strTitle.slice(index + tagTypeSearchKeyword.length);
				const title =
					index > -1 && tagTypeSearchKeyword.trim() ? (
						<span>
							{beforeStr}
							<span className="site-tree-search-value">{tagTypeSearchKeyword}</span>
							{afterStr}
						</span>
					) : (
						<span>{strTitle}</span>
					);

				if (item.children) {
					return { ...item, title, children: loop(item.children) };
				}

				return { ...item, title };
			});

		return loop(filteredTree);
	}, [businessCategoryTreeData, tagTypeSearchKeyword]);

	const handleExpand = useCallback((newExpandedKeys: React.Key[]) => {
		setExpandedKeys(newExpandedKeys);
		disableAutoExpand();
	}, []);

	const handleTagTypeTreeCheck = useCallback(
		(checkedKeysValue: any) => {
			const checkedKeys = Array.isArray(checkedKeysValue)
				? checkedKeysValue
				: checkedKeysValue.checked;
			const newCheckedKeys = (checkedKeys as Array<string | number>).map((key) =>
				String(key),
			);
			setCheckedTagTypeKeys(newCheckedKeys);
			setSelectedBusinessCategories(newCheckedKeys);

			// 勾选节点后同步展开祖先层级，避免选中结果隐藏在折叠树中。
			setExpandedKeys((prevExpandedKeys) => {
				const parentKeysToExpand = new Set<React.Key>(prevExpandedKeys);
				for (const checkedKey of newCheckedKeys) {
					const parentKeys = getAllParentKeys(checkedKey, businessCategoryTreeData);
					for (const parentKey of parentKeys) {
						parentKeysToExpand.add(parentKey);
					}
				}
				return Array.from(parentKeysToExpand);
			});
			enableAutoExpand();
		},
		[businessCategoryTreeData],
	);

	// 过滤后的显性/隐形离散标签
	const filteredVisibleDiscreteTags = useMemo(
		() =>
			filterTagsByBusinessCategory(
				allTags.filter((tag) => tag.tagVisibility === VISIBLE_TAG_VALUE),
				selectedBusinessCategories,
			),
		[allTags, selectedBusinessCategories],
	);
	const filteredInvisibleTags = useMemo(
		() =>
			filterTagsByBusinessCategory(
				allTags.filter((tag) => tag.tagVisibility === INVISIBLE_TAG_VALUE),
				selectedBusinessCategories,
			),
		[allTags, selectedBusinessCategories],
	);

	const normalizeDistributionModuleValue = useCallback(
		(value?: string) => {
			if (!value) {
				return "";
			}

			const currentValue = String(value);
			const matchedDict =
				tagDistributionModuleDictData.find((item) => item.dictValue === currentValue) ??
				tagDistributionModuleDictData.find((item) => item.dictLabel === currentValue);

			return matchedDict?.dictValue ?? currentValue;
		},
		[tagDistributionModuleDictData],
	);

	const filteredInvisibleDiscreteTags = useMemo(
		() =>
			filteredInvisibleTags.filter((tag) => {
				const moduleValue = normalizeDistributionModuleValue(tag.tagDistributionModule);
				return (
					moduleValue === DISCRETE_MODULE_VALUE ||
					!ONE_HEART_FOUR_FORCES_MODULE_VALUES.has(moduleValue)
				);
			}),
		[filteredInvisibleTags, normalizeDistributionModuleValue],
	);

	const filteredInvisibleAbilityTags = useMemo(
		() =>
			filteredInvisibleTags.filter((tag) => {
				const moduleValue = normalizeDistributionModuleValue(tag.tagDistributionModule);
				return ONE_HEART_FOUR_FORCES_MODULE_VALUES.has(moduleValue);
			}),
		[filteredInvisibleTags, normalizeDistributionModuleValue],
	);

	// 按标签分布模块字典值分类，仅 01-05 参与右侧能力图展示。
	const abilityModuleTags = useMemo(() => {
		const tags = filteredInvisibleAbilityTags;
		return {
			serviceHeartTags: tags.filter(
				(tag) =>
					normalizeDistributionModuleValue(tag.tagDistributionModule) ===
					SERVICE_HEART_MODULE_VALUE,
			),
			bodyForceTags: tags.filter(
				(tag) =>
					normalizeDistributionModuleValue(tag.tagDistributionModule) ===
					BODY_FORCE_MODULE_VALUE,
			),
			operationTags: tags.filter(
				(tag) =>
					normalizeDistributionModuleValue(tag.tagDistributionModule) ===
					OPERATION_MODULE_VALUE,
			),
			intelligenceTags: tags.filter(
				(tag) =>
					normalizeDistributionModuleValue(tag.tagDistributionModule) ===
					INTELLIGENCE_MODULE_VALUE,
			),
			marketTags: tags.filter(
				(tag) =>
					normalizeDistributionModuleValue(tag.tagDistributionModule) ===
					MARKET_MODULE_VALUE,
			),
		};
	}, [filteredInvisibleAbilityTags, normalizeDistributionModuleValue]);

	const hasPortraitContent = Boolean(basicInfo || allTags.length > 0 || radarDetailData);

	return (
		<Drawer
			title="人才画像"
			placement="right"
			width="1536px"
			open={open}
			onClose={onClose}
			destroyOnHidden
			closable={false}
			extra={
				<button
					type="button"
					onClick={onClose}
					className="cursor-pointer border-0 bg-transparent text-gray-500 hover:text-gray-700"
				>
					<CloseOutlined />
				</button>
			}
			classNames={{
				body: "custom-scrollbar",
			}}
		>
			{/* 主体高度跟随抽屉视口，右侧标签区在剩余空间内等分显性与隐性。 */}
			<div className="relative">
				<div className="flex min-h-0 w-full flex-1 flex-col">
					{hasPortraitContent ? (
						<div className="grid w-full flex-1 grid-cols-[minmax(320px,auto)_1fr] grid-rows-[84px_minmax(0,1fr)] gap-4">
							{/* 左侧：标签类型（搜索框 + 树）；撑满上下高度 */}
							<div className="row-span-2 flex min-h-0 min-w-[320px] flex-col self-stretch rounded border bg-white p-3">
								<SectionTitle title="标签类型" className="mb-3" />
								<Input
									placeholder="搜索名称"
									allowClear
									value={tagTypeSearchKeyword}
									onChange={(e) => setTagTypeSearchKeyword(e.target.value)}
									suffix={<SearchOutlined className="text-gray-400" />}
									className="mb-3"
								/>
								<div className="custom-scrollbar min-h-0 flex-1 overflow-auto">
									{displayedTagTypeTree.length > 0 ? (
										<Tree
											checkable
											selectable={false}
											treeData={displayedTagTypeTree}
											checkedKeys={checkedTagTypeKeys}
											onCheck={handleTagTypeTreeCheck}
											expandedKeys={expandedKeys}
											autoExpandParent={autoExpandParent}
											onExpand={handleExpand}
											blockNode
										/>
									) : (
										<div className="flex h-full min-h-[200px] items-center justify-center">
											<Empty
												image={Empty.PRESENTED_IMAGE_SIMPLE}
												description={
													tagTypeSearchKeyword
														? "无匹配标签类型"
														: "暂无标签类型"
												}
											/>
										</div>
									)}
								</div>
							</div>

							{/* 右侧第 1 行：个人基本信息；固定高度保持不变。 */}
							<div className="flex items-center overflow-hidden">
								<PortraitBasicInfoSection data={basicInfo ?? null} />
							</div>

							{/* 右侧第 2 行：大盒子撑满剩余高度，显性和隐性两块等分。 */}
							<div className="flex min-h-0 flex-col gap-4 overflow-hidden">
								<div className="grid min-h-[432px] flex-[1_1_0] grid-cols-1 gap-6 overflow-hidden rounded border bg-[#F5F7FA] p-4 xl:grid-cols-[300px_minmax(0,1fr)]">
									{/* 显性标签：内容超出时内部滚动 */}
									<div className="flex min-h-0 flex-col overflow-hidden">
										<SectionTitle title="显性标签" className="mb-3" />
										<DiscreteTagsSection
											title="离散标签"
											tags={filteredVisibleDiscreteTags}
											className="min-h-0 w-[300px] flex-1"
										/>
									</div>

									{/* 雷达图：高度自适应，无滚动条 */}
									<div className="flex h-full min-h-0 items-center justify-center">
										<RadarChart
											radarData={radarData}
											educationDetail={educationDetail}
											qualificationDetail={qualificationDetail}
											performanceDetail={performanceDetail}
											onEducationClick={openEducationModal}
											onQualificationClick={openQualificationDrawer}
											onPerformanceClick={openPerformanceModal}
											className="h-full min-h-0 w-full"
										/>
									</div>
								</div>

								<div className="grid min-h-[432px] flex-[1_1_0] grid-cols-1 gap-6 overflow-hidden rounded border bg-[#F5F7FA] p-4 xl:grid-cols-[300px_minmax(0,1fr)]">
									{/* 隐形标签：内容超出时内部滚动 */}
									<div className="flex min-h-0 flex-col overflow-hidden">
										<SectionTitle title="隐形标签" className="mb-3" />
										<DiscreteTagsSection
											title="离散标签"
											tags={filteredInvisibleDiscreteTags}
											className="min-h-0 w-[300px] flex-1"
										/>
									</div>

									{/* 能力模型图表：高度自适应，无滚动条 */}
									<div className="flex h-full min-h-0 items-center justify-center">
										<AbilityModelChart
											serviceHeartTags={abilityModuleTags.serviceHeartTags}
											bodyForceTags={abilityModuleTags.bodyForceTags}
											operationTags={abilityModuleTags.operationTags}
											intelligenceTags={abilityModuleTags.intelligenceTags}
											marketTags={abilityModuleTags.marketTags}
											className="h-full min-h-0 w-full"
										/>
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="flex h-60 items-center justify-center">
							<Empty image={EmptyDataSvg} description="暂无画像数据" />
						</div>
					)}
				</div>
				{isLoading && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
						<Spin />
					</div>
				)}
			</div>
			{educationDetail && (
				<EducationDetailModal
					open={isEducationModalOpen}
					onClose={closeEducationModal}
					score={educationDetail.score}
					scaleLabel={educationDetail.scale}
					firstDegree={educationDetail.firstDegree}
					firstDegreeSchool={radarDetailData?.education.firstLevelSchool}
					highestDegree={educationDetail.highestDegree}
					highestDegreeSchool={radarDetailData?.education.highLevelSchool}
				/>
			)}
			{performanceDetail && (
				<PerformanceDetailModal
					open={isPerformanceModalOpen}
					onClose={closePerformanceModal}
					score={performanceDetail.score}
					gradeLabel={performanceDetail.scale}
				/>
			)}
			{qualificationDetail && (
				<QualificationDetailDrawer
					open={isQualificationDrawerOpen}
					obtainedCertificates={radarDetailData?.qualification.obtainedCertificates}
					score={radarDetailData?.qualification.score}
					onClose={closeQualificationDrawer}
				/>
			)}
		</Drawer>
	);
}
