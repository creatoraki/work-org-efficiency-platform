/**
 * AI 智能标签相关类型定义
 */

/**
 * 标签元数据项（接口返回格式）
 */
export interface LabelMetaItem {
	/** 标签code */
	labelCode: string;
	/** 标签名称 */
	labelName: string;
	/** 标签值 */
	labelValue: string;
	/** 标签描述 */
	labelDescription: string;
	/** 标签类别 */
	labelCategoryCode: string;
	/** 是否已存在 */
	isExist: boolean;
	/** 是否敏感 */
	isSensitive: boolean;
}

/**
 * 获取标签元数据参数
 */
export interface LabelMetaParams {
	/** 标签code */
	labelCode: string;
}

/**
 * 根据 sessionId 获取标签元数据参数
 */
export interface LabelMetaBySessionParams {
	/** 会话ID */
	sessionId: string;
	/** 操作人工号。当前后端会从登录态自动填充，前端可不传 */
	optWorkNo?: string;
}

/**
 * 批量修改标签元数据状态参数
 */
export interface BatchUpdateLabelMetaStatusParams {
	/** 标签code列表 */
	codes: string[];
	/** 操作类型：delete-删除，online-上架，offline-下架 */
	optType?: string;
}

/**
 * 智能标签删除参数。
 */
export interface SmartTagDeleteParams {
	/** AI 会话 ID */
	sessionId: string;
	/** 新增标签 code 列表 */
	newTagCodes: string[];
	/** 已存在标签 code 列表 */
	existingTagCodes: string[];
}

/**
 * 标签明细数据项（hrbrain/label/data 接口返回）
 */
export interface LabelDataItem {
	/** 工号 */
	workNo: string;
	/** 部门名称 */
	deptName: string;
	/** 姓名 */
	name: string;
	/** 标签值 */
	labelValue: string;
	/** 标签标题 */
	labelTitle: string;
	/** 部门编码 */
	deptNo: string;
}

/**
 * 获取标签明细参数
 */
export interface LabelDataParams {
	/** 标签 code */
	labelCode: string;
	/** 页码 */
	pageNum?: number;
	/** 每页数量 */
	pageSize?: number;
}
