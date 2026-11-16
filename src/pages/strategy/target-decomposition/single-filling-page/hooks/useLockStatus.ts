import {
	fetchSubmitUserIndicatorDetailUpperRight,
	submitEditLock,
	submitEditUnLock,
} from "#src/api/strategy/target-filling";
import { message } from "antd";
import { useState } from "react";

/**
 * 编辑锁定状态管理 Hook（简化版 - 仅状态管理）
 * 不包含定时轮询，由主文件控制
 */
export function useLockStatus(userId: string | number) {
	const [lockStatus, setLockStatus] = useState<number>(0);
	const [curEditor, setCurEditor] = useState<string | number | undefined>(undefined);
	const [curEditorName, setCurEditorName] = useState<string | undefined>(undefined);

	// 更新锁定状态（从 API 响应数据）
	const updateLockStatus = (data: any) => {
		setCurEditor(data.curEditor);
		setCurEditorName(data.curEditorName);
		setLockStatus(data.curEditor && data.curEditor === userId ? 1 : 0);
	};

	// 加锁（解锁 API，实际是获取编辑权限）
	const acquireLock = async (selectedKey: string | number) => {
		try {
			const res: any = await submitEditUnLock(selectedKey);
			if (res?.code === 200) {
				// 重新获取锁定状态
				const detailRes: any = await fetchSubmitUserIndicatorDetailUpperRight(selectedKey);
				if (detailRes?.data) {
					updateLockStatus(detailRes.data);
				}
				return true;
			} else {
				message.error(res?.msg || "加锁失败");
				return false;
			}
		} catch (e) {
			console.error("acquireLock failed", e);
			return false;
		}
	};

	// 解锁（释放编辑权限）
	const releaseLock = async (selectedKey: string | number) => {
		try {
			const res: any = await submitEditLock(selectedKey);
			if (res?.code === 200) {
				setLockStatus(0);
				setCurEditor(undefined);
				setCurEditorName(undefined);
				return true;
			} else {
				message.error(res?.msg || "解锁失败");
				return false;
			}
		} catch (e) {
			console.error("releaseLock failed", e);
			return false;
		}
	};

	// 重置锁定状态
	const resetLockStatus = () => {
		setLockStatus(0);
		setCurEditor(undefined);
		setCurEditorName(undefined);
	};

	return {
		lockStatus,
		setLockStatus,
		curEditor,
		setCurEditor,
		curEditorName,
		setCurEditorName,
		updateLockStatus,
		acquireLock,
		releaseLock,
		resetLockStatus,
	};
}
