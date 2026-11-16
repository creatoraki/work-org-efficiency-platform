import type { ReactNode } from "react";

import { Dropdown } from "antd";

/**
 * 列设置下拉属性
 */
interface ColumnSettingProps {
	/** 可切换显示的列 */
	options: Array<{ key: string; label: string }>;
	/** 已隐藏的列 key */
	hiddenKeys: string[];
	/** 隐藏列变更回调 */
	onChange: (hiddenKeys: string[]) => void;
	/** 触发元素（表头的设置图标） */
	children: ReactNode;
}

/**
 * 表格列设置下拉
 *
 * 操作列表头的设置图标用于控制数据列显隐；
 * 当前显隐状态仅保存在前端，接入后端后可保存用户偏好。
 *
 * @param props - 组件属性
 * @param props.options - 可切换显示的列
 * @param props.hiddenKeys - 已隐藏的列 key
 * @param props.onChange - 隐藏列变更回调
 * @param props.children - 触发元素
 * @returns 列设置下拉
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function ColumnSetting({ options, hiddenKeys, onChange, children }: ColumnSettingProps) {
	return (
		<Dropdown
			trigger={["click"]}
			dropdownRender={() => (
				<div className="min-w-[160px] rounded-[3px] border border-[#E4E7ED] bg-white py-1 shadow-md">
					{options.map((option) => {
						const visible = !hiddenKeys.includes(option.key);
						return (
							<button
								key={option.key}
								type="button"
								className="flex w-full cursor-pointer items-center gap-2 whitespace-nowrap border-0 bg-transparent px-3 py-1 text-left text-sm leading-[22px] text-[#323233] hover:bg-[#F5F7FA]"
								onClick={() => {
									onChange(
										visible
											? [...hiddenKeys, option.key]
											: hiddenKeys.filter((key) => key !== option.key),
									);
								}}
							>
								<span className={visible ? "text-[#0075FF]" : "text-transparent"}>
									✓
								</span>
								{option.label}
							</button>
						);
					})}
				</div>
			)}
		>
			{children}
		</Dropdown>
	);
}
