/**
 * 标签表格区域组件
 */

import type { TreeTagItem } from "#src/api/personnel-archive/archive-management";
import type { FormInstance } from "antd";
import type { ColumnType } from "antd/es/table";
import { ConfigProvider, Form, Table } from "antd";

/**
 * 获取标签表格行唯一标识。
 *
 * @param record - 标签记录
 * @returns 标签行 key，优先使用业务标签 ID，避免依赖 antd 已废弃的 rowKey index 参数
 */
function getTagTableRowKey(record: TreeTagItem): string {
	const tagId = (record as any).tagId;
	return String(tagId ?? record.id ?? record.userTagId);
}

/**
 * TagTableSection 组件属性
 */
interface TagTableSectionProps {
	/** 是否为审核模式 */
	isAuditMode: boolean;
	/** 是否为查看模式 */
	isViewMode: boolean;
	/** 是否为编辑模式 */
	isEditMode: boolean;
	/** 表格列配置 */
	columns: ColumnType<TreeTagItem>[];
	/** 选中的标签列表 */
	selectedTagsList: TreeTagItem[];
	/** 表单实例 */
	form: FormInstance;
	/** 表单值变化回调 */
	onFormValuesChange?: (changedValues: any, allValues: any) => void;
}

/**
 * 标签表格区域组件
 *
 * @param props - 组件属性
 * @param props.isAuditMode - 是否为审核模式
 * @param props.isViewMode - 是否为查看模式
 * @param props.isEditMode - 是否为编辑模式
 * @param props.columns - 表格列配置
 * @param props.selectedTagsList - 选中的标签列表
 * @param props.form - 表单实例
 * @param props.onFormValuesChange - 表单值变化回调
 * @returns 标签表格区域元素
 */
export function TagTableSection({
	isAuditMode,
	isViewMode: _isViewMode,
	isEditMode: _isEditMode,
	columns,
	selectedTagsList,
	form,
	onFormValuesChange,
}: TagTableSectionProps) {
	return (
		<section className="flex flex-col overflow-hidden">
			<ConfigProvider
				theme={{
					components: {
						Form: {
							labelColonMarginInlineStart: 0,
							labelColonMarginInlineEnd: 0,
						},
					},
				}}
			>
				{/* 表格 */}
				<div className="flex-1 overflow-hidden">
					<Form
						form={form}
						colon={false}
						variant="borderless"
						onValuesChange={onFormValuesChange}
					>
						{isAuditMode ? (
							// 审核模式只借用 Form 连接实例，不使用 Form.List 编辑字段。
							<Table
								columns={columns}
								dataSource={selectedTagsList.map((tag) => ({
									...tag,
									key: String((tag as any).tagId),
								}))}
								rowKey={getTagTableRowKey}
								size="small"
								pagination={false}
								scroll={{ y: "calc(100vh - 570px)" }}
								bordered
							/>
						) : (
							<Form.List name="tags">
								{() => (
									<Table
										columns={columns}
										dataSource={selectedTagsList.map((tag) => ({
											...tag,
											key: String((tag as any).tagId),
										}))}
										rowKey={getTagTableRowKey}
										size="small"
										pagination={false}
										scroll={{ y: "calc(100vh - 570px)" }}
										bordered
									/>
								)}
							</Form.List>
						)}
					</Form>
				</div>
			</ConfigProvider>
		</section>
	);
}
