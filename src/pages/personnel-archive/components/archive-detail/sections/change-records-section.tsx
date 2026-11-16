/**
 * 变更记录区块组件
 *
 * 展示人员档案的标签变更记录
 */

import { SectionTitle } from "#src/components";

/**
 * 变更记录项
 */
export interface ChangeRecord {
	/** 标签ID */
	id: string;
	/** 标签名称 */
	tagName: string;
	/** 旧值 */
	oldValue: string;
	/** 新值 */
	newValue: string;
	/** 是否为暂存记录 */
	tempSave: boolean;
}

/**
 * 变更记录区块属性
 */
interface ChangeRecordsSectionProps {
	/** 变更记录列表 */
	changeRecords: ChangeRecord[];
}

/**
 * 格式化空值显示
 *
 * @param value - 原始值
 * @returns 格式化后的值
 */
function formatEmptyValue(value: string): string {
	if (!value || value.trim() === "" || value === "空") {
		return "-";
	}
	return value;
}

/**
 * 变更记录区块组件
 *
 * @param props - 组件属性
 * @param props.changeRecords - 变更记录列表
 * @returns 变更记录区块元素
 */
export function ChangeRecordsSection({ changeRecords }: ChangeRecordsSectionProps) {
	return (
		<section className="flex min-h-0 flex-col gap-4">
			<SectionTitle title="变更记录" />
			<div className="min-h-0 flex-1 overflow-y-auto rounded border p-4 pr-1">
				{changeRecords.length > 0 ? (
					<ul className="m-0 list-none space-y-2 p-0">
						{changeRecords.map((record) => {
							const isOldValueEmpty =
								!record.oldValue ||
								record.oldValue.trim() === "" ||
								record.oldValue === "空";

							// 根据 tempSave 和 oldValue 显示不同文案
							// tempSave=true 且 oldValue 为空：暂存"标签"为"值"
							// tempSave=true 且 oldValue 不为空：将"标签"的"旧值"暂存为"新值"
							// tempSave=false 且 oldValue 为空：新增"标签"为"值"
							// tempSave=false 且 oldValue 不为空：将"标签"的"旧值"变更为"新值"
							return (
								<li
									key={record.id}
									className="flex items-start gap-2 border-b border-gray-100 pb-2 last:border-0 last:pb-0"
								>
									<span
										className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"
										aria-hidden="true"
									></span>
									<div className="min-w-0 flex-1">
										{isOldValueEmpty ? (
											<div className="text-xs leading-snug text-gray-800">
												{record.tempSave ? "暂存" : "新增"}
												<span className="font-medium text-gray-900">
													"{record.tagName}"
												</span>
												为
												<span className="font-medium text-green-600">
													"{formatEmptyValue(record.newValue)}"
												</span>
											</div>
										) : (
											<div className="text-xs leading-snug text-gray-800">
												将
												<span className="font-medium text-gray-900">
													"{record.tagName}"
												</span>
												的
												<span className="font-medium text-red-600">
													"{formatEmptyValue(record.oldValue)}"
												</span>
												{record.tempSave ? "暂存为" : "变更为"}
												<span className="font-medium text-green-600">
													"{formatEmptyValue(record.newValue)}"
												</span>
											</div>
										)}
									</div>
								</li>
							);
						})}
					</ul>
				) : (
					<p className="py-8 text-center text-xs text-gray-400">暂无变更记录</p>
				)}
			</div>
		</section>
	);
}
