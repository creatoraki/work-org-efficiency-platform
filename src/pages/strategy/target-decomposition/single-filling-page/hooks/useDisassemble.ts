import type { DisassembleSubmitConfig, DisassembleTreeNode } from "../types";
import {
	fetchSubmitUserIndicatorDisassembleSubTree,
	submitSubmitUserIndicatorDisassembleSub,
} from "#src/api/strategy/target-filling";
import { message } from "antd";
import { useState } from "react";

/**
 * 目标拆解功能 Hook
 */
export function useDisassemble(planId: string, onSuccess?: () => void) {
	const [disassembleVisible, setDisassembleVisible] = useState(false);
	const [disassembleTreeData, setDisassembleTreeData] = useState<DisassembleTreeNode[]>([]);
	const [disassembleSelectedKeys, setDisassembleSelectedKeys] = useState<React.Key[]>([]);
	const [disassembleExpandedKeys, setDisassembleExpandedKeys] = useState<React.Key[]>([]);
	const [disassembleLoading, setDisassembleLoading] = useState(false);
	const [disassembleSubmitConfigs, setDisassembleSubmitConfigs] = useState<
		DisassembleSubmitConfig[]
	>([]);
	const [, setCurrentRecord] = useState<any>(null);

	// 打开拆解弹窗
	const openDisassembleModal = (record: any) => {
		if (!planId || !record?.targetOrgCode) return;

		setCurrentRecord(record);
		setDisassembleVisible(true);
		setDisassembleLoading(true);

		fetchSubmitUserIndicatorDisassembleSubTree({
			effTaskIndicatorSubmitUserId: planId,
			targetOrgCode: record.targetOrgCode,
		} as any)
			.then((res: any) => {
				if (res?.data) {
					const treeData = res.data || [];
					setDisassembleTreeData(treeData);

					// 默认展开所有节点
					const allKeys: React.Key[] = [];
					const traverse = (nodes: DisassembleTreeNode[]) => {
						nodes.forEach((node) => {
							allKeys.push(node.key);
							if (node.children) traverse(node.children);
						});
					};
					traverse(treeData);
					setDisassembleExpandedKeys(allKeys);
				}
			})
			.finally(() => {
				setDisassembleLoading(false);
			});
	};

	// 提交拆解
	const submitDisassemble = async () => {
		if (!planId || disassembleSubmitConfigs.length === 0) {
			message.warning("请选择拆解对象");
			return;
		}

		setDisassembleLoading(true);

		try {
			const targetOrgConfig: Record<
				string,
				{ targetOrgName: string; fullRoadStrength: string }
			> = {};
			disassembleSubmitConfigs.forEach((item, index) => {
				targetOrgConfig[`key-${index}`] = {
					targetOrgName: item.targetOrgName,
					fullRoadStrength: item.fullRoadStrength,
				};
			});

			const res: any = await submitSubmitUserIndicatorDisassembleSub({
				effTaskIndicatorSubmitUserId: planId,
				targetOrgConfig,
			} as any);

			if (res?.code === 200) {
				message.success("拆解成功");
				setDisassembleVisible(false);
				setDisassembleSelectedKeys([]);
				setDisassembleSubmitConfigs([]);
				onSuccess?.();
			} else {
				message.error(res?.msg || "拆解失败");
			}
		} catch (e) {
			console.error("submitDisassemble failed", e);
			message.error("拆解失败");
		} finally {
			setDisassembleLoading(false);
		}
	};

	// 处理树节点选择
	const handleTreeCheck = (checkedKeys: React.Key[], info: any) => {
		setDisassembleSelectedKeys(checkedKeys);

		const checkedNodes: DisassembleTreeNode[] = info.checkedNodes || [];
		const configs: DisassembleSubmitConfig[] = checkedNodes
			.filter((node: DisassembleTreeNode) => node.canChoose)
			.map((node: DisassembleTreeNode) => ({
				targetOrgName: node.name || node.title,
				fullRoadStrength: node.fullRoadStrength || "",
			}));

		setDisassembleSubmitConfigs(configs);
	};

	// 关闭弹窗
	const closeDisassembleModal = () => {
		setDisassembleVisible(false);
		setDisassembleSelectedKeys([]);
		setDisassembleSubmitConfigs([]);
	};

	return {
		disassembleVisible,
		disassembleTreeData,
		disassembleSelectedKeys,
		disassembleExpandedKeys,
		disassembleLoading,
		disassembleSubmitConfigs,
		openDisassembleModal,
		submitDisassemble,
		handleTreeCheck,
		closeDisassembleModal,
		setDisassembleExpandedKeys,
	};
}
