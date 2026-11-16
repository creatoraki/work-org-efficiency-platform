/**
 * 标签结构常量定义（前端维护）
 * 后端只返回数据值，前端根据此配置展示标签
 */

/**
 * 标签定义
 */
export interface TagDef {
	id: string; // 标签ID（对应后端数据key）
	tagName: string; // 标签名称
	isRequired?: boolean; // 是否必填
	options?: string[]; // 下拉选项（简化：直接字符串数组）
	attachmentProof?: string; // 附件证明说明
	expiryDate?: string; // 过期时间
}

/**
 * 标签分类定义
 */
export interface CategoryDef {
	id: string;
	name: string;
	children?: CategoryDef[];
	tags: TagDef[];
}
