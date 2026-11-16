/**
 * 字典数据项类型
 * 对应数据库表：sys_dict_data
 */
export interface DictDataItem {
	/** 字典编码（主键） */
	dictCode: number;
	/** 字典排序 */
	dictSort: number;
	/** 字典标签 */
	dictLabel: string;
	/** 字典键值 */
	dictValue: string;
	/** 字典类型 */
	dictType: string;
	/** 样式属性（其他样式扩展） */
	cssClass: string | null;
	/** 表格回显样式 */
	listClass: string | null;
	/** 是否默认（Y是 N否） */
	isDefault: "Y" | "N";
	/** 状态（0正常 1停用） */
	status: "0" | "1";
	/** 创建者 */
	createBy: string | null;
	/** 创建时间 */
	createTime: string | null;
	/** 更新者 */
	updateBy: string | null;
	/** 更新时间 */
	updateTime: string | null;
	/** 备注 */
	remark: string | null;
	/** API 序列化时添加的字段（不在数据库表中） */
	params?: {
		"@type": string;
	};
	/** 前端计算字段：isDefault === "Y" */
	default?: boolean;
}

/**
 * 字典选项类型（转换后的格式）
 * 保留所有原始字段，并添加 label 和 value 字段用于 Select 等组件
 */
export interface DictOption extends DictDataItem {
	label: string;
	value: string;
	disabled?: boolean;
}
