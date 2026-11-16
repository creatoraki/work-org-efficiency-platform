/**
 * 组织大脑 - 人员档案资历类型定义
 */

/**
 * 资历证书字典项
 */
export interface CertificateDictItem {
	/** 证书字典主键ID */
	id?: number;
	/** 证书ID */
	certId?: string;
	/** 证书名称 */
	name: string;
	/** 证书等级 */
	level: string;
	/** 证书类别 */
	category: string;
	/** 证书类型 */
	type: string;
	/** 管理级别 */
	managementLevel: string;
	/** 刻度得分 */
	scaleScore: number;
}
