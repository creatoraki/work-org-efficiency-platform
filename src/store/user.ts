import type { UserInfoType } from "#src/api/user/types";
import { fetchUserInfo, fetchUserPerm } from "#src/api/user";

import { create } from "zustand";

const initialState = {
	id: "",
	avatar: "",
	username: "",
	email: "",
	phoneNumber: "",
	description: "",
	roles: [],
	nickName: "",
	deptName: "",
	staffJobName: "",
	dept: {
		deptName: "",
	},
	// menus: [],
	perms: [],
	admin: false,
	userCode: "",
};

type UserState = UserInfoType;

interface UserAction {
	getUserInfo: () => Promise<UserInfoType>;
	reset: () => void;
}

export const useUserStore = create<UserState & UserAction>()((set) => ({
	...initialState,

	getUserInfo: async () => {
		const [response, permRes]: [any, any] = await Promise.all([
			fetchUserInfo(),
			fetchUserPerm(),
		]);
		set({
			...response.user,
			id: response.user.userId,
			roles: response.roles,
			perms: permRes.data || [],
		});
		return response;
	},

	reset: () => {
		return set({
			...initialState,
		});
	},
}));
