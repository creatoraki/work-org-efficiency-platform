/**
 * 组织大脑 - 人员档案资历接口
 */

import type { CertificateDictItem } from "./types";
import { request } from "#src/utils/axios-request";

export type { CertificateDictItem } from "./types";

interface RawCertificateItem {
	id?: number;
	certId?: string;
	certName?: string;
	certGrade?: string;
	certClass?: string;
	certType?: string;
	managementLevel?: string;
	scaleScore?: number;
}

/**
 * 统一证书字典文本字段的空值展示。
 *
 * 兼容接口返回的 null、空字符串、纯空格及历史占位符 "-"，统一转换为 "/"。
 *
 * @param value - 接口返回的文本字段
 * @returns 证书字典表格展示文本
 *
 * @author 王善能
 * @since 2026-07-15
 */
function normalizeCertificateText(value?: string | null): string {
	const normalizedValue = value?.trim();
	return normalizedValue && normalizedValue !== "-" ? normalizedValue : "/";
}

function normalizeCertificateItem(item: RawCertificateItem): CertificateDictItem {
	return {
		id: item.id,
		certId: item.certId,
		name: normalizeCertificateText(item.certName),
		level: normalizeCertificateText(item.certGrade),
		category: normalizeCertificateText(item.certClass),
		type: normalizeCertificateText(item.certType),
		managementLevel: normalizeCertificateText(item.managementLevel),
		scaleScore: item.scaleScore ?? 0,
	};
}

/**
 * 获取人员档案资历证书字典
 *
 * @returns 资历证书字典数据
 */
export async function fetchQualificationCertificateDict(): Promise<CertificateDictItem[]> {
	return request
		.get<RawCertificateItem[]>("org-brain/personnel-archive/qualification/dict")
		.then((list) => list.map(normalizeCertificateItem));
}
