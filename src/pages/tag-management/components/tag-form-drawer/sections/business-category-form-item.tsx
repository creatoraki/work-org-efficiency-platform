import type { Rule } from "antd/es/form";
import type { NamePath } from "antd/es/form/interface";
import type { BusinessCategoryOption } from "../utils";
import { ProFormItem } from "@ant-design/pro-components";
import { Cascader, Input } from "antd";
import {
	findBusinessCategoryPath,
	formatBusinessCategoryDisplay,
	getBusinessCategoryLeafCode,
} from "../utils";

interface BusinessCategoryFormItemProps {
	name: NamePath;
	label: string;
	placeholder?: string;
	options: BusinessCategoryOption[];
	rules?: Rule[];
	readonly?: boolean;
}

/**
 * 业务类别表单项
 *
 * 表单存储后端需要的叶子编码，Cascader 控件展示 Ant Design 需要的完整路径。
 */
export function BusinessCategoryFormItem({
	name,
	label,
	placeholder,
	options,
	rules,
	readonly = false,
}: BusinessCategoryFormItemProps) {
	if (readonly) {
		return (
			<ProFormItem
				name={name}
				label={label}
				rules={rules}
				getValueProps={(value?: string | string[]) => ({
					value: formatBusinessCategoryDisplay(value, options),
				})}
			>
				<Input disabled readOnly />
			</ProFormItem>
		);
	}

	return (
		<ProFormItem
			name={name}
			label={label}
			rules={rules}
			getValueProps={(value?: string | string[]) => ({
				value: value ? findBusinessCategoryPath(value, options) : undefined,
			})}
			normalize={(value?: string | string[]) => getBusinessCategoryLeafCode(value)}
		>
			<Cascader
				options={options}
				showSearch
				changeOnSelect={false}
				placeholder={placeholder}
			/>
		</ProFormItem>
	);
}
