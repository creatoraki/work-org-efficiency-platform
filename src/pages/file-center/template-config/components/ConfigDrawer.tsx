/**
 * 导出模板配置抽屉
 * 用于新增和编辑导出模板配置
 */

import type { ExcelConfigItem } from "../types";
import { createExcelConfig, updateExcelConfig } from "#src/api/file/export-config";
import { commonDrawerProps } from "#src/pages/strategy/target-management/constants/base.js";
import { Button, Divider, Drawer, Form, Input, InputNumber, Select, Space } from "antd";
import { useEffect, useState } from "react";
import { DRAWER_WIDTH, MODULE_OPTIONS } from "../constants";
import { convertFormArrayToJson, convertJsonToFormArray } from "../utils";
import JsonFieldEditor from "./JsonFieldEditor";
import KeyValueEditor from "./KeyValueEditor";
import QueryStructureEditor from "./QueryStructureEditor";
import ResultStructureEditor from "./ResultStructureEditor";
import TwoDimensionalArrayEditor from "./TwoDimensionalArrayEditor";

interface Props {
	/** 是否显示 */
	visible: boolean;
	/** 模式: 新增或编辑 */
	mode: "create" | "edit";
	/** 编辑时的记录数据 */
	record?: ExcelConfigItem;
	/** 关闭回调 */
	onClose: (saved?: boolean) => void;
}

export default function ConfigDrawer({ visible, mode, record, onClose }: Props) {
	const [form] = Form.useForm();
	const [confirmLoading, setConfirmLoading] = useState(false);

	// 编辑模式时初始化表单
	useEffect(() => {
		if (visible && mode === "edit" && record) {
			const recordResultStructure = record.resultStructure
				? {
						dataPath: record.resultStructure?.dataPath?.map((item: any) => {
							return { path: item };
						}),
					}
				: null;
			form.setFieldsValue({
				...record,
				// JSON 字段转换为表单格式
				exportTableHead: convertJsonToFormArray(record.exportTableHead),
				// topHeaders 是二维数组，直接使用
				topHeaders: record.topHeaders || [],
				reqCondition: record.reqCondition || {},
				resultStructure: recordResultStructure,
			});
		} else if (visible && mode === "create") {
			form.resetFields();
		}
	}, [visible, mode, record, form]);

	// 提交处理
	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			setConfirmLoading(true);
			const newResultStructure = {
				...values.resultStructure,
				dataPath: values.resultStructure?.dataPath?.map((item: any) => {
					return item.path;
				}),
			};
			// 表单格式转换为 JSON
			const params = {
				...values,
				// excelId: Number(values.excelId),
				id: mode === "edit" ? record?.id : undefined,
				exportTableHead: convertFormArrayToJson(values.exportTableHead),
				// topHeaders 是二维数组，直接使用
				topHeaders: values.topHeaders || [],
				resultStructure: newResultStructure,
			};

			if (mode === "create") {
				await createExcelConfig(params);
			} else {
				await updateExcelConfig(params);
			}

			onClose(true);
		} catch (error) {
			console.error("表单验证失败:", error);
		} finally {
			setConfirmLoading(false);
		}
	};

	return (
		<Drawer
			title={mode === "create" ? "新增导出模板" : "编辑导出模板"}
			width={DRAWER_WIDTH}
			open={visible}
			{...commonDrawerProps(onClose)}
			footer={
				<div className="text-right">
					<Space>
						<Button onClick={() => onClose(false)}>取消</Button>
						<Button type="primary" onClick={handleOk} loading={confirmLoading}>
							确定
						</Button>
					</Space>
				</div>
			}
		>
			<Form form={form} layout="vertical">
				{/* 基础字段 */}
				<Form.Item
					name="excelId"
					label="Excel模板ID"
					rules={[{ required: true, message: "请输入模板ID" }]}
				>
					<InputNumber className="w-full" min={1} />
				</Form.Item>
				<Form.Item
					name="fileName"
					label="文件名"
					rules={[{ required: true, message: "请输入文件名" }]}
				>
					<Input placeholder="例: 用户数据导出" />
				</Form.Item>

				<Form.Item
					name="module"
					label="所属模块"
					rules={[{ required: true, message: "请选择所属模块" }]}
				>
					<Select options={MODULE_OPTIONS} placeholder="请选择" />
				</Form.Item>

				<Form.Item
					name="dataReqUrl"
					label="数据请求URL"
					rules={[{ required: true, message: "请输入数据请求URL" }]}
				>
					<Input placeholder="例: /api/user/list" />
				</Form.Item>
				<Form.Item
					name="reqCondition"
					label="请求参数配置"
					tooltip="配置导出时需要的请求参数,如 targetPlanId: 900188"
				>
					<KeyValueEditor placeholder="添加请求参数" />
				</Form.Item>

				{/* JSON 配置区 */}
				<Divider>高级配置(可选)</Divider>

				<Form.Item
					name="exportTableHead"
					label="导出表头配置"
					tooltip="配置Excel导出的表头字段,每项包含字段编码和字段名称"
				>
					<JsonFieldEditor
						fields={["tableHeadCode", "tableHeadName"]}
						placeholder="添加表头字段"
					/>
				</Form.Item>

				<Form.Item
					name="topHeaders"
					label="顶部表头配置"
					tooltip="配置Excel导出的顶部表头，每列包含两个元素"
				>
					<TwoDimensionalArrayEditor
						itemSize={2}
						itemLabels={["元素1", "元素2"]}
						placeholder="添加顶部表头列"
					/>
				</Form.Item>

				{/* 查询结构配置 - 使用可视化编辑器 */}
				<Form.Item
					name="queryStructure"
					label="查询结构配置"
					tooltip="定义分页参数映射，如页码、每页数量等"
				>
					<QueryStructureEditor />
				</Form.Item>

				<Form.Item
					name="resultStructure"
					label="返回结果结构配置"
					tooltip="定义返回数据路径，如总条数位置、数据数组位置"
				>
					<ResultStructureEditor />
				</Form.Item>
			</Form>
		</Drawer>
	);
}
