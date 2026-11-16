/**
 * 档案操作业务逻辑 Hook
 *
 * 负责处理审核通过、驳回、提交、暂存等业务操作
 */

import type { TreeTagItem } from "#src/api/personnel-archive/archive-management";
import type { FormInstance } from "antd";
import { passArchiveAudit, refuseArchiveAudit } from "#src/api/personnel-archive/archive-audit";
import {
	saveArchiveDraft,
	submitArchiveForAudit,
} from "#src/api/personnel-archive/archive-management";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { App } from "antd";
import React, { useCallback, useState } from "react";

/**
 * 档案动作提交类型。
 */
export type ArchiveSubmittingAction = "pass" | "refuse" | "saveDraft" | "submit";

/**
 * useArchiveActions 参数
 */
interface UseArchiveActionsParams {
	/** 表单实例 */
	form: FormInstance;
	/** 驳回表单实例 */
	refuseForm: FormInstance;
	/** 选中的标签列表 */
	selectedTagsList: TreeTagItem[];
	/** 选中的标签 ID 列表（数值类型） */
	selectedTagIds: number[];
	/** 用户ID */
	userId: string | number;
	/** 维护人 */
	maintainer?: string;
	/** 从详情中获取的维护人 */
	maintainerFromDetail?: string;
	/** 不允许修改的状态列表 */
	disabledStatuses: readonly string[];
	/** 构建表格数据函数 */
	buildTableData: () => TreeTagItem[];
	/** 准备提交数据函数 */
	prepareSubmitData: () => any[];
	/** 准备暂存数据函数 */
	prepareDraftData: () => any[];
	/** 刷新详情数据 */
	refreshArchiveDetail: () => void;
	/** 刷新回调 */
	onRefresh?: () => void;
}

/**
 * useArchiveActions 返回值
 */
interface UseArchiveActionsReturn {
	/** 是否正在提交 */
	isSubmitting: boolean;
	/** 当前正在执行的提交动作 */
	submittingAction: ArchiveSubmittingAction | null;
	/** 是否显示驳回弹窗 */
	isRefuseModalOpen: boolean;
	/** 设置是否显示驳回弹窗 */
	setIsRefuseModalOpen: (open: boolean) => void;
	/** 处理审核通过 */
	handlePass: () => Promise<void>;
	/** 处理审核驳回 */
	handleRefuse: () => void;
	/** 确认驳回 */
	handleConfirmRefuse: () => Promise<void>;
	/** 处理暂存 */
	handleSaveDraft: () => Promise<void>;
	/** 处理提交审核 */
	handleSubmit: () => Promise<void>;
}

/**
 * 档案操作业务逻辑 Hook
 */
export function useArchiveActions({
	form,
	refuseForm,
	selectedTagsList,
	selectedTagIds,
	userId: _userId,
	maintainer,
	maintainerFromDetail,
	disabledStatuses,
	buildTableData,
	prepareSubmitData,
	prepareDraftData,
	refreshArchiveDetail,
	onRefresh,
}: UseArchiveActionsParams): UseArchiveActionsReturn {
	const { message, modal } = App.useApp();
	const [submittingAction, setSubmittingAction] = useState<ArchiveSubmittingAction | null>(null);
	const [isRefuseModalOpen, setIsRefuseModalOpen] = useState(false);
	const isSubmitting = submittingAction !== null;

	/**
	 * 处理审核通过
	 */
	const handlePass = useCallback(async () => {
		if (selectedTagIds.length === 0) {
			message.warning("请至少选择一个标签");
			return;
		}

		// 获取选中的标签名称
		const tagNames = selectedTagsList.map((tag) => tag.tagName).filter(Boolean);
		const tagNameText = tagNames.join("、");

		modal.confirm({
			title: "请确认是否通过",
			content: `通过对象： ${tagNameText}`,
			icon: React.createElement(ExclamationCircleFilled),
			centered: true,
			onOk: async () => {
				setSubmittingAction("pass");
				try {
					await passArchiveAudit({ ids: selectedTagsList.map((tag) => Number(tag.id)) });
					message.success("审核通过成功");
					refreshArchiveDetail();
					onRefresh?.();
				} catch (error) {
					console.error("审核通过失败:", error);
				} finally {
					setSubmittingAction(null);
				}
			},
		});
	}, [message, modal, selectedTagIds, selectedTagsList, refreshArchiveDetail, onRefresh]);

	/**
	 * 处理审核驳回
	 */
	const handleRefuse = useCallback(() => {
		if (selectedTagIds.length === 0) {
			message.warning("请至少选择一个标签");
			return;
		}
		setIsRefuseModalOpen(true);
	}, [message, selectedTagIds]);

	/**
	 * 确认驳回（审核模式）
	 */
	const handleConfirmRefuse = useCallback(async () => {
		try {
			const values = await refuseForm.validateFields();
			setSubmittingAction("refuse");
			try {
				await refuseArchiveAudit({
					approvalComments: values.auditComment,
					ids: selectedTagsList.map((tag) => Number(tag.id)),
				});
				message.success("审核驳回成功");
				setIsRefuseModalOpen(false);
				refuseForm.resetFields();
				refreshArchiveDetail();
				onRefresh?.();
			} catch (error) {
				console.error("审核驳回失败:", error);
			} finally {
				setSubmittingAction(null);
			}
		} catch (error) {
			console.error("表单验证失败:", error);
		}
	}, [message, refuseForm, selectedTagsList, refreshArchiveDetail, onRefresh]);

	/**
	 * 处理暂存
	 */
	const handleSaveDraft = useCallback(async () => {
		try {
			await form.validateFields(["tags"]);
		} catch {
			return;
		}

		const draftData = prepareDraftData();
		if (draftData.length === 0) {
			message.warning("暂无变化，无需暂存");
			return;
		}
		setSubmittingAction("saveDraft");
		try {
			const submitMaintainer = maintainerFromDetail ?? maintainer;
			await saveArchiveDraft(draftData, submitMaintainer);
			message.success("暂存成功");
			refreshArchiveDetail();
			onRefresh?.();
		} catch (error) {
			console.error("暂存失败:", error);
		} finally {
			setSubmittingAction(null);
		}
	}, [
		message,
		form,
		prepareDraftData,
		maintainer,
		maintainerFromDetail,
		refreshArchiveDetail,
		onRefresh,
	]);

	/**
	 * 处理提交审核
	 */
	const handleSubmit = useCallback(async () => {
		const tableData = buildTableData();
		const fieldsToValidate: Array<string | number | (string | number)[]> = [];

		// 构建需要验证的字段路径（仅验证非待审核状态的标签）
		for (const [index, tag] of tableData.entries()) {
			if (tag.id == null) {
				continue;
			}
			const status = tag.status ?? "1";
			if (!disabledStatuses.includes(status)) {
				if (tag.isRequired === "1") {
					fieldsToValidate.push(["tags", index, "tagValue"] as (string | number)[]);
				}
			}
		}

		// 构建需要验证的附件字段路径
		for (const [index, tag] of tableData.entries()) {
			if (tag.id == null) {
				continue;
			}
			const status = tag.status ?? "1";
			if (!disabledStatuses.includes(status)) {
				if (tag.isAttProofTagging === "1") {
					fieldsToValidate.push(["tags", index, "tagFileList"] as (string | number)[]);
				}
			}
		}

		try {
			if (fieldsToValidate.length > 0) {
				await form.validateFields(fieldsToValidate);
			}
		} catch {
			return;
		}

		const submitData = prepareSubmitData();

		if (submitData.length === 0) {
			message.warning("没有需要提交的数据");
			return;
		}

		setSubmittingAction("submit");
		try {
			const submitMaintainer = maintainerFromDetail ?? maintainer;
			await submitArchiveForAudit(submitData, submitMaintainer);
			message.success("提交成功");
			refreshArchiveDetail();
			onRefresh?.();
		} catch (error) {
			console.error("提交失败:", error);
		} finally {
			setSubmittingAction(null);
		}
	}, [
		message,
		form,
		buildTableData,
		prepareSubmitData,
		disabledStatuses,
		maintainer,
		maintainerFromDetail,
		refreshArchiveDetail,
		onRefresh,
	]);

	return {
		isSubmitting,
		submittingAction,
		isRefuseModalOpen,
		setIsRefuseModalOpen,
		handlePass,
		handleRefuse,
		handleConfirmRefuse,
		handleSaveDraft,
		handleSubmit,
	};
}
