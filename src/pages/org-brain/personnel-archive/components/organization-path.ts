/**
 * 格式化人员档案组织路径。
 *
 * 后端使用英文逗号分隔组织层级，前端统一过滤空层级并使用大于号连接。
 *
 * @param organizationPath - 后端返回的组织路径
 * @returns 使用大于号连接的组织路径；无有效内容时返回占位符
 *
 * @author 王善能
 * @since 2026-07-15
 */
export function formatOrganizationPath(organizationPath?: string): string {
	if (!organizationPath) {
		return "/";
	}

	return (
		organizationPath
			.split(",")
			.map((organizationName) => organizationName.trim())
			.filter(Boolean)
			.join(">") || "/"
	);
}
