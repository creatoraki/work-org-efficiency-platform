export interface RoleItemType {
	/* 角色ID */
	roleId: number;

	/* 角色名称 */
	roleName: string;

	/* 分类id */
	categoryId: number;

	/* 分类名称 */
	categoryName: string;

	/* 角色类型 */
	roleType: number;

	/* 角色类型名称 */
	roleTypeName: string;

	/* 角色状态 */
	status: string;

	/* 角色状态名称 */
	statusName: string;

	/* 更新人账号 */
	updateBy: string;

	/* 更新时间 */
	updateTime: Record<string, unknown>;

	/* 成员数量 */
	memberNumber: number;
}
export interface EditParams {
	/* 角色ID */
	roleId: number;

	/* 分类id */
	categoryId: number;

	/* 备注 */
	remark?: string;
}

export interface AddRoleType {
	/* 角色名称 */
	roleName: string;

	/* 分类id */
	categoryId: number;

	/* 角色类型 */
	roleType: number;

	/* 备注 */
	remark?: string;
}

export interface RoleListType {
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
export interface RoleDeptList {
	name: string;

	/* */
	id: number;

	/* */
	config?: {
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
	children?: RoleDeptList[];
}
export interface RoleDeptTree {
	/* 返回码 */
	code: number;

	/* 返回码说明 */
	msg: string;
	success: boolean;
	/* 返回数据 */
	data: RoleDeptList[];
}

export interface AddRoleTreeType {
	/* 父id，0为根节点 */
	parentId: number;

	/* 分类名称 */
	categoryName: string;
}

export interface RoleInfoDetailType {
	/* 角色ID */
	roleId: number;

	/* 角色名称 */
	roleName: string;

	/* 分类id */
	categoryId: number;

	/* 分类名称 */
	categoryName: string;

	/* 角色类型 */
	roleType: number;

	/* 角色类型名称 */
	roleTypeName: string;

	/* 备注 */
	remark: string;

	/* 菜单列表 */
	menuTree: {
		/* */
		name: Record<string, unknown>;

		/* */
		id: string;

		/* */
		parentId: string;

		/* */
		weight: string;

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
		empty: boolean;
	}[];

	/* 菜单权限编辑视图信息列表 */
	dataPermList: {
		/* 角色ID */
		roleId: number;

		/* 菜单id */
		menuId: number;

		/* 保密等级 */
		perm: {
			/* */
			confidentialLevelList: Record<string, unknown>[];
		};
	}[];

	/* 更新人账号 */
	updateBy: string;

	/* 更新时间 */
	updateTime: Record<string, unknown>;
}

export interface RoleUserListParams {
	/* 页码(不能为空) */
	pageNum: number;

	/* 每页数量(不能为空) */
	pageSize: number;

	/* 是否查询总条数 */
	searchCount?: boolean;

	/* 排序字段集合 */
	sortItemList?: {
		/* true正序|false倒序 */
		isAsc: boolean;

		/* 排序字段 */
		column: string;
	}[];

	/* 角色ID */
	roleId?: number;

	/* 所属组织 */
	orgId?: number;

	/* 员工姓名 */
	name?: string;

	/* 员工账号 */
	account?: string;

	/* 电话号码 */
	phoneNumber?: string;

	/* 用户状态 */
	status?: string;

	/* 在职状态 */
	jobStatus?: number;
}
export interface RoleUserListRes {
	/* 用户ID */
	userId: number;

	/* 员工姓名 */
	name: string;

	/* 员工账号 */
	account: string;

	/* 电话号码 */
	phoneNumber: string;

	/* 用户状态 */
	status: string;

	/* 用户状态 */
	statusNane: string;

	/* 在职状态 */
	jobStatus: number;

	/* 在职状态 */
	jobStatusName: string;

	/* 所属组织 */
	orgId: number;

	/* 所属组织名称 */
	orgName: string;

	/* 数据范围ID列表 */
	projIdList: {
		id: number;
		name: string;
	}[];
}
export interface UnbindRoleUserParams {
	/* 角色ID */
	roleId: number;

	/* 用户ID */
	userIdList?: number[];
}
export interface UnbindRoleUserRes {
	/* 返回码 */
	code: number;

	/* 返回码说明 */
	msg: string;

	/* 返回数据 */
	data: string;
}

export interface SaveRoleUserParams {
	/* 绑定用户成员信息 */
	bindForm?: {
		/* 角色ID */
		roleId: number;

		/* 用户ID */
		userIdList?: number[];
	};

	/* 解绑用户成员信息 */
	unbindForm?: {
		/* 角色ID */
		roleId: number;

		/* 用户ID */
		userIdList?: number[];
	};

	/* 角色用户数据范围保存表单 */
	dataScopeSaveForms?: {
		/* 用户ID */
		userId: number;

		/* 数据范围ID */
		projIdList?: number[];
	}[];
}

export interface ListByDeptIdRes {
	/* 返回码 */
	code: number;

	/* 返回码说明 */
	msg: string;

	/* 返回数据 */
	data: {
		/* 主键 */
		id: number;

		/* 姓名 */
		name: string;

		/* 工号 */
		userCode: string;
	}[];
}

export interface SaveRoleMenuParams {
	/* 角色ID */
	roleId: number;

	/* 菜单id */
	menuIdList: Record<string, unknown>[];

	/* 菜单数据权限 */
	dataPermList?: {
		/* 角色ID */
		roleId: number;

		/* 菜单id */
		menuId: number;

		/* 保密等级 */
		confidentialLevelList?: Record<string, unknown>[];
	}[];
}

export interface Add_10Params {
	/* 主键id */
	id?: number;

	/* ehr角色id */
	ehrRoleId?: number;

	/* 关联系统角色id */
	roleId?: number;

	/* 公司层级标识 */
	orgLevel?: number;
}

export interface GetNoBindEhrRoleInfoRes {
	/* 主键id */
	id: number;
	/* ehr角色id */
	roleId: number;
	/* ehr角色名称 */
	roleName: string;
}
