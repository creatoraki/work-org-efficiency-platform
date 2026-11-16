/**
 * 标签表单抽屉 - 标签呈现表单
 */

import { SectionTitle } from "#src/components/section-title";
import { useDict } from "#src/hooks";
import { TAG_DICT_KEYS, TAG_RULE_TYPE_DICT, YES_NO } from "#src/pages/tag-management/config";
import { ProFormDependency, ProFormRadio, ProFormSelect } from "@ant-design/pro-components";

/**
 * 标签呈现表单组件属性
 */
interface TagPresentationSectionProps {
	/** 标签库类型 */
	tagLibraryType: TAG_RULE_TYPE_DICT;
	/** 在组织大脑呈现切换回调 */
	onDisplayInOrgBrainChange: (value: boolean) => void;
	/** 标签显隐情况切换回调 */
	onTagVisibilityChange: (value: string) => void;
}

/**
 * 标签呈现表单组件（仅用于人才标签）
 *
 * 包含以下字段：
 * - 在组织大脑呈现（isDisplayInOrgBrain）：默认选中"是"，选中"否"时，标签显隐情况不显示
 * - 标签显隐情况（tagVisibility）：默认选中"显性"，仅在"在组织大脑呈现"为"是"时显示，选中"隐形"时，显示标签分布模块
 * - 标签分布模块（tagDistributionModule）：仅在"在组织大脑呈现"为"是"且"标签显隐情况"为"隐形"时显示
 *
 * @param props - 组件属性
 * @param props.tagLibraryType - 标签库类型
 * @param props.onDisplayInOrgBrainChange - 在组织大脑呈现切换回调
 * @param props.onTagVisibilityChange - 标签显隐情况切换回调
 * @returns 标签呈现表单 JSX
 */
export function TagPresentationSection({
	tagLibraryType,
	onDisplayInOrgBrainChange,
	onTagVisibilityChange,
}: TagPresentationSectionProps) {
	// 获取标签分布模块字典选项（必须在条件判断之前调用）
	const { options: tagDistributionModuleOptions } = useDict(
		TAG_DICT_KEYS.TAG_USER_DISTRIBUTION_MODULE,
		{
			staleTime: 10 * 60 * 1000, // 10 分钟数据新鲜时间
			gcTime: 10 * 60 * 1000, // 10 分钟缓存保留时间
		},
	);

	// 仅人才标签显示
	if (tagLibraryType !== TAG_RULE_TYPE_DICT.TALENT) {
		return null;
	}

	return (
		<div>
			<SectionTitle title="标签呈现" className="mb-4" />

			{/* 在组织大脑呈现 */}
			<ProFormRadio.Group
				name="isDisplayInOrgBrain"
				label="在组织大脑呈现"
				rules={[{ required: true, message: "请选择在组织大脑呈现" }]}
				options={[
					{ label: "是", value: true },
					{ label: "否", value: false },
				]}
				fieldProps={{
					onChange: (e) => {
						const value = e.target.value;
						onDisplayInOrgBrainChange(value);
					},
				}}
			/>

			{/* 标签显隐情况 - 仅在"在组织大脑呈现"为"是"时显示 */}
			<ProFormDependency name={["isDisplayInOrgBrain"]}>
				{({ isDisplayInOrgBrain }) => (
					<ProFormRadio.Group
						name="tagVisibility"
						label="标签显隐情况"
						rules={[
							{
								required: isDisplayInOrgBrain === true,
								message: "请选择标签显隐情况",
							},
						]}
						options={[
							{ label: "显性", value: YES_NO.YES },
							{ label: "隐形", value: YES_NO.NO },
						]}
						hidden={isDisplayInOrgBrain === false}
						fieldProps={{
							onChange: (e) => {
								const value = e.target.value;
								onTagVisibilityChange(value);
							},
						}}
					/>
				)}
			</ProFormDependency>

			{/* 标签分布模块 - 仅在"在组织大脑呈现"为"是"且"标签显隐情况"为"隐形"时显示 */}
			<ProFormDependency name={["isDisplayInOrgBrain", "tagVisibility"]}>
				{({ isDisplayInOrgBrain, tagVisibility }) => (
					<ProFormSelect
						name="tagDistributionModule"
						label="标签分布模块"
						placeholder="请选择标签分布模块"
						rules={[
							{
								required:
									isDisplayInOrgBrain === true && tagVisibility === YES_NO.NO,
								message: "请选择标签分布模块",
							},
						]}
						options={tagDistributionModuleOptions}
						hidden={!(isDisplayInOrgBrain === true && tagVisibility === YES_NO.NO)}
					/>
				)}
			</ProFormDependency>
		</div>
	);
}
