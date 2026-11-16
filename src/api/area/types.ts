/**
 * 区域 API 类型
 */

/**
 * 获取省市区信息 - 请求参数
 */
export interface GetAreaParams {
	/** 区域名称 */
	areaName?: string;

	/** 父级ID */
	parentId?: string;
}

/**
 * 区域信息项
 */
export interface AreaItem {
	/** 主键ID */
	id: number;

	/** 名称 */
	name: string;

	/** 编码 */
	code: string;

	/** 短编码 */
	shortCode: string;

	/** 描述 */
	description: string;

	/** 父级ID */
	parentId: string;

	/** parentId是否业务ID,1:是,0:否 */
	parentidIsBusiness: number;

	/** 状态,0:未启用,1:已启用 */
	nsMdmState: number;

	/** 是否生效,1:是,0:否 */
	nsMdmEffective: number;

	/** 上次加载时间 */
	nsMdmLastload: Record<string, unknown>;

	/** 发布时间（数据修改时间） */
	nsMdmReleaseTime: Record<string, unknown>;

	/** 祖父简称 */
	grandpshortname: string;

	/** 父简称 */
	parentshortname: string;

	/** 更新年份 */
	updateyear: string;

	/** 祖父名称 */
	grandpname: string;

	/** 祖父ID */
	grandpId: string;

	/** 父名称 */
	parentname: string;

	/** 节点层级 */
	nodeLevel: number;

	/** 是否删除,1:是，0：否 */
	isDelete: number;

	/** 创建人 */
	createUserId: number;

	/** 创建时间 */
	createTime: Record<string, unknown>;

	/** 更新人 */
	updateUserId: number;

	/** 更新时间 */
	updateTime: Record<string, unknown>;

	/** 远程系统id */
	remoteSystemId: number;

	/** 是否撤销，是，否 */
	isstop: string;
}

/**
 * 获取省市区信息 - 响应
 */
export type GetAreaResponse = ApiResponse<AreaItem[]>;
