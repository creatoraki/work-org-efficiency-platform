export interface UserItemType {
	/* 用户id */
	id: number;

	/* 用户名称 */
	name: string;

	/* 用户账号 */
	account: string;

	/* 岗位名称 */
	staffJobName: string;

	/* 部门名称 */
	deptName: string;
	/* 组织名称 */
	deptFullName: string;
	/* 电话号码 */
	mobileNum: string;

	/* 用户状态 */
	status: string;

	/* 用户状态名称 */
	statusNane?: string;

	/* 在职状态 */
	jobStatus: string;

	/* 在职状态 */
	jobStatusName: string;

	/* 用户类型 */
	userType: string;

	/* 最后登录时间 */
	loginDate: Record<string, unknown>;
}
export interface AddUserType {
	/* 用户名称 */
	name?: string;

	/* 用户账号 */
	account?: string;

	/* 电话号码 */
	mobileNum?: string;

	/* 岗位code */
	staffJobCode?: string;
}

export interface UserListType {
	/* 返回码 */
	code: number;

	/* 返回码说明 */
	msg: string;

	/* 返回数据 */
	data: {
		/* 当前页 */
		pageNum: number;

		/* 每页的数量 */
		pageSize: number;

		/* 总记录数 */
		total: number;

		/* 总页数 */
		pages: number;

		/* 结果集 */
		list: {
			/* 主键 */
			id: number;

			/* 姓名 */
			name: string;
		}[];

		/* 是否为空 */
		emptyFlag: boolean;
	};
}
export interface UserTreeType {
	/* 部门ID */
	deptId: number;

	/* 部门编码 */
	deptCode: string;

	/* 部门名称 */
	deptName: string;

	/* 父部门ID */
	parentId: number;

	/* 子部门 */
	children?: UserTreeType[];
}

export interface UserInfoDetailType {
	/* 账号 */
	account: string;

	/* 姓名 */
	name: string;

	/* 岗位名称 */
	staffJobName: string;

	/* 手机号码 */
	mobileNum: string;

	/* 角色组 */
	roles: {
		/* 创建者 */
		createBy: string;

		/* 创建时间 */
		createTime: Record<string, unknown>;

		/* 更新者 */
		updateBy: string;

		/* 更新时间 */
		updateTime: Record<string, unknown>;

		/* 备注 */
		remark: string;

		/* 请求参数 */
		params: Record<string, unknown>;

		/* */
		roleId: number;

		/* */
		roleName: string;

		/* */
		roleKey: string;

		/* */
		roleSort: number;

		/* */
		dataScope: string;

		/* */
		menuCheckStrictly: boolean;

		/* */
		deptCheckStrictly: boolean;

		/* */
		status: string;

		/* */
		delFlag: string;

		/* */
		flag: boolean;

		/* */
		menuIds: Record<string, unknown>[];

		/* */
		deptIds: Record<string, unknown>[];

		/* */
		permissions: Record<string, unknown>[];

		/* */
		admin: boolean;
	}[];

	/* 数据范围 */
	projs: {
		/* 创建者 */
		createBy: string;

		/* 创建时间 */
		createTime: Record<string, unknown>;

		/* 更新者 */
		updateBy: string;

		/* 更新时间 */
		updateTime: Record<string, unknown>;

		/* 备注 */
		remark: string;

		/* 请求参数 */
		params: Record<string, unknown>;

		/* */
		deptId: number;

		/* */
		parentId: number;

		/* */
		ancestors: string;

		/* */
		deptName: string;

		/* */
		orderNum: number;

		/* */
		leader: string;

		/* */
		phone: string;

		/* */
		email: string;

		/* */
		status: string;

		/* */
		delFlag: string;

		/* */
		parentName: string;
	}[];

	/* 组织范围 */
	depts: {
		/* 创建者 */
		createBy: string;

		/* 创建时间 */
		createTime: Record<string, unknown>;

		/* 更新者 */
		updateBy: string;

		/* 更新时间 */
		updateTime: Record<string, unknown>;

		/* 备注 */
		remark: string;

		/* 请求参数 */
		params: Record<string, unknown>;

		/* */
		deptId: number;

		/* */
		parentId: number;

		/* */
		ancestors: string;

		/* */
		deptName: string;

		/* */
		orderNum: number;

		/* */
		leader: string;

		/* */
		phone: string;

		/* */
		email: string;

		/* */
		status: string;

		/* */
		delFlag: string;

		/* */
		parentName: string;
	}[];

	/* 权限 */
	userMenuEditBO: {
		/* 用户id */
		userId: number;

		/* 菜单列表 */
		menuTree: MenuTree;

		/* 菜单权限编辑视图信息列表 */
		dataPermList: {
			/* 用户id */
			userId: number;

			/* 菜单id */
			menuId: number;

			/* 保密等级 */
			perm: {
				/* */
				confidentialLevelList: Record<string, unknown>[];
			};

			/* 是否继承角色 */
			inheritsRole: boolean;

			/* 继承角色权限 */
			inheritsRoleData: {
				/* 角色ID */
				roleId: number;

				/* 菜单id */
				menuId: number;

				/* 保密等级 */
				perm: {
					/* */
					confidentialLevelList: Record<string, unknown>[];
				};
			};
		}[];
	};
}

export interface UserInfoUpdateType {
	/* 用户ID */
	userId?: number;

	/* 用户角色 */
	roleIds?: Record<string, unknown>[];

	/* 组织范围 */
	deptIds?: Record<string, unknown>[];

	/* 项目范围 */
	projIds?: Record<string, unknown>[];

	/* 用户权限 */
	userMenuSaveForm?: {
		/* 用户ID */
		userId: number;

		/* 用户菜单 */
		menuIdList?: {
			/* 菜单id */
			menuId?: number;

			/* 是否继承角色 */
			inheritsRole?: boolean;
		}[];

		/* 菜单数据权限 */
		dataPermList?: {
			/* 用户ID */
			userId: number;

			/* 菜单id */
			menuId: number;

			/* 是否继承角色 */
			inheritsRole?: boolean;

			/* 数据权限 */
			perm?: {
				/* */
				confidentialLevelList?: Record<string, unknown>[];
			};
		}[];
	};
}
export interface UserPermPageType {
	/* 当前页 */
	pageNum: number;

	/* 每页的数量 */
	pageSize: number;

	/* 总记录数 */
	total: number;

	/* 总页数 */
	pages: number;

	/* 结果集 */
	list: {
		/* 主键 */
		id: number;

		/* 用户id */
		userId: number;

		/* 工号 */
		userCode: string;

		/* 用户名称 */
		userName: string;

		/* 所属部门名称 */
		departName: string;

		/* 数据主键id */
		dataId: number;

		/* 数据类型 */
		dataType: number;

		/* 权限 */
		perm: number;

		/* 排序字段 默认1 ,为0不可任何操作 */
		sort: number;

		/* 前端提供悬空版本 */
		suspendedVersion: string;
	}[];

	/* 是否为空 */
	emptyFlag: boolean;
}
export interface UserResetPwdType {
	userId?: number;
	password?: string;
}

export interface ListWithRolesRes {
	/* */
	name: Record<string, unknown>;

	/* */
	id: string;

	/* */
	config: {
		/* */
		idKey: string;

		/* */
		parentIdKey: string;

		/* */
		weightKey: string;

		/* */
		nameKey: string;

		/* */
		childrenKey: string;

		/* */
		deep: number;
	};

	/* */
	parentId: string;

	/* */
	weight: string;

	/* */
	empty: boolean;
}

export interface MenuTree {
	/* */
	checked: boolean;
	children: MenuTree[];
	id: number;
	inheritsRole: boolean;
	level: number;
	name: string;
	parentId: number;
	userChecked: boolean;
}
export interface UserMenuMergeRoleMenuRes {
	/* 用户id */
	userId: number;

	/* 菜单列表 */
	menuTree: MenuTree[];

	/* 菜单权限编辑视图信息列表 */
	dataPermList: {
		/* 用户id */
		userId: number;

		/* 菜单id */
		menuId: number;

		/* 保密等级 */
		perm: {
			/* 敏感标签权限列表 */
			confidentialLevelList: Record<string, unknown>[];

			/* 部门审核权限列表 */
			jobAuditDeptList: Record<string, unknown>[];
		};

		/* 是否继承角色 */
		inheritsRole: boolean;

		/* 继承角色权限 */
		inheritsRoleData: {
			/* 角色ID */
			roleId: number;

			/* 菜单id */
			menuId: number;

			/* 保密等级 */
			perm: {
				/* 敏感标签权限列表 */
				confidentialLevelList: Record<string, unknown>[];

				/* 部门审核权限列表 */
				jobAuditDeptList: Record<string, unknown>[];
			};
		};
	}[];
}
