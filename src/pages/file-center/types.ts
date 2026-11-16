/**
 * 导入任务状态枚举
 */
export enum ImportStatus {
	/** 排队中 */
	QUEUED = 0,
	/** 进行中 */
	IN_PROGRESS = 1,
	/** 成功 */
	SUCCESS = 2,
	/** 失败 */
	FAILED = 3,
	/** 取消 */
	CANCELLED = 6,
}

/**
 * 导入记录行数据
 */
export interface ImportRecord {
	/** 主键 */
	id: string | number;
	/** 文件名称 */
	name: string;
	/** 模块名称 */
	module: string;
	/** 文件大小(字节) */
	fileSize: number;
	/** 文件大小（带单位） */
	fileSizeStr?: string;
	/** 状态 */
	status: ImportStatus;
	/** 状态文本 */
	statusFormat: string;
	/** 进度(0-100) */
	progress?: number;
	/** 存储桶名称 */
	bucketName?: string;
	/** 导出时间 */
	updateTime: string;
	createTime?: string;
	/** 错误信息 */
	errorMessage?: string;
	/** 备注 */
	remark?: string;
	/** 源文件 */
	sourceFile?: string;
	/** 失败反馈文件 */
	errorFile?: string;
	/** 已完成总数 */
	completedTotalNum?: number;
	/** 总数 */
	totalNum?: number;
}

/**
 * 分页参数
 */
export interface PaginationParams {
	current: number;
	pageSize: number;
	total: number;
}

/**
 * 搜索表单值
 */
export interface SearchFormValues {
	/** 文件名称 */
	name?: string;
	/** 模块路径(级联选择器) */
	module?: string[];
	/** 状态 */
	status?: number;
	/** 时间范围 */
	dateRange?: [string, string];
}

/**
 * 模块选项(级联选择器)
 */
export interface ModuleOption {
	id: string;
	value: string;
	label: string;
	isLeaf: boolean;
	selectable: boolean;
	children?: ModuleOption[];
}

/**
 * 字典数据项
 */
export interface DictItem {
	id: string;
	label: string;
	value: string;
	nodeType?: string;
}

/**
 * WebSocket 消息
 */
export interface WebSocketMessage {
	/** 消息类型 */
	msgType: number;
	/** 消息数据 */
	data?: ImportRecord;
}
