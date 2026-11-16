/**
 * 规则库 API（组织和人才共用）
 *
 * 注意：使用规则库相关接口时，需要传入 type 参数来区分组织和人才：
 * - '1': 组织标签规则库
 * - '2': 人才标签规则库
 *
 * 主要接口：
 * - fetchRuleLibraryList: 获取规则库列表（type 必填）
 * - createRuleLibrary: 创建规则库（type 必填）
 * - updateRuleLibrary: 更新规则库（type 必填）
 * - checkDuplicateName: 校验规则名称是否重复（type 必填）
 * - getJobPositionTree: 获取岗位职位树（人才标签规则库专用）
 */
export * from "./rule-library";
