# useDict Hook

字典数据获取 Hook，基于 React Query 实现，提供统一的字典数据获取和转换功能。

## 功能特性

- ✅ 自动缓存：数据在 5 分钟内视为新鲜，不会重复请求
- ✅ 类型安全：完整的 TypeScript 类型定义
- ✅ 数据转换：自动将 `dictLabel`/`dictValue` 转换为 `label`/`value` 格式
- ✅ 原始数据：保留所有字典字段（dictCode, dictSort, cssClass 等）
- ✅ 工具函数：提供数据转换和快速查找的工具函数

## 基础用法

### 获取原始数据

```tsx
import { useDict } from "#src/hooks";

function MyComponent() {
	const { data, isLoading } = useDict("tag_rule_update_frequency");

	// data 是 React Query 返回的原始数据，包含所有字段：dictCode, dictSort, dictLabel, dictValue, cssClass 等
	const firstItem = data?.[0];

	return <div>{firstItem?.dictLabel}</div>;
}
```

### 用于 Select 组件（推荐方式）

```tsx
import { useDict } from "#src/hooks";
import { Select } from "antd";

function MyComponent() {
	const { options, isLoading } = useDict("tag_rule_update_frequency");

	return <Select options={options} loading={isLoading} placeholder="请选择更新频次" />;
}
```

## 高级用法

### 快速查找

```tsx
import { useDict } from "#src/hooks";

function MyComponent() {
	const { valueMap, labelMap, codeMap } = useDict("tag_rule_update_frequency");

	// 根据 value 查找
	const item = valueMap.get("2");
	const label = item?.dictLabel; // '日'

	// 根据 label 查找
	const item2 = labelMap.get("日");
	const value = item2?.dictValue; // '2'

	// 根据 dictCode 查找
	const item3 = codeMap.get(120);
	const code = item3?.dictCode; // 120

	return <div>{label}</div>;
}
```

### 访问其他字段

```tsx
import { useDict } from "#src/hooks";

function MyComponent() {
	const { getItem, getItemByCode } = useDict("tag_rule_update_frequency");

	// 使用便捷方法获取字典项
	const item = getItem("2");
	const item2 = getItemByCode(120);

	// 访问所有字段
	const dictCode = item?.dictCode; // 120
	const dictSort = item?.dictSort; // 1
	const cssClass = item?.cssClass; // null
	const listClass = item?.listClass; // 'default'
	const status = item?.status; // '0'

	return <div>Code: {dictCode}</div>;
}
```

### 条件启用

```tsx
import { useDict } from "#src/hooks";

function MyComponent({ dictType }: { dictType?: string }) {
	const { data } = useDict(dictType, {
		enabled: !!dictType, // 只有当 dictType 存在时才请求
	});

	return <div>{data?.length || 0} 项</div>;
}
```

### 禁用选项

```tsx
import { useDict } from "#src/hooks";

function MyComponent() {
	const { options } = useDict("tag_rule_update_frequency", {
		disabled: true, // 所有选项都会被禁用
	});

	return <Select options={options} />;
}
```

### 自定义缓存时间

```tsx
import { useDict } from "#src/hooks";

function MyComponent() {
	const { data } = useDict("tag_rule_update_frequency", {
		staleTime: 10 * 60 * 1000, // 10 分钟
		gcTime: 30 * 60 * 1000, // 30 分钟
	});

	return <div>{data?.length}</div>;
}
```

### 使用便捷方法

```tsx
import { useDict } from "#src/hooks";

function MyComponent() {
	const { getLabel, getValue, getItem } = useDict("tag_rule_update_frequency");

	// 根据 value 获取 label
	const label = getLabel("2"); // '日'

	// 根据 label 获取 value
	const value = getValue("日"); // '2'

	// 获取完整字典项
	const item = getItem("2"); // { dictCode: 120, dictLabel: '日', ... }

	return <div>{label}</div>;
}
```

### 列表翻译（常用场景）

```tsx
import { useDict } from "#src/hooks";
import { Table } from "antd";

function MyComponent() {
	const { translate, translateBatch, renderLabel } = useDict("tag_rule_update_frequency");

	// 单个翻译
	const label = translate("2"); // '日'

	// 批量翻译
	const labels = translateBatch(["1", "2", "3"]); // ['无', '日', '月']

	// 表格列渲染（推荐）
	const columns = [
		{
			title: "更新频次",
			dataIndex: "updateFrequency",
			render: renderLabel, // 直接使用，自动处理 null/undefined
		},
	];

	return <Table columns={columns} dataSource={data} />;
}
```

### 表格列翻译示例

`renderLabel` 函数已适配 **antd Table Columns** 的 `render` 签名：`(value, record, index) => ReactNode`

当设置了 `dataIndex` 时，第一个参数 `value` 就是字段值，可以直接使用 `renderLabel`。

```tsx
import { useDict } from "#src/hooks";
import type { ProColumns } from "@ant-design/pro-components";

function MyComponent() {
	const { renderLabel, translate } = useDict("tag_rule_update_frequency");

	const columns: ProColumns<MyDataType>[] = [
		{
			title: "更新频次",
			dataIndex: "updateFrequency",
			// 方式1：直接使用 renderLabel（推荐）
			// renderLabel 已适配 antd Table Columns render 签名：(value, record, index) => ReactNode
			render: renderLabel,
		},
		{
			title: "更新频次2",
			dataIndex: "updateFrequency2",
			// 方式2：使用 translate（需要处理空值）
			render: (value) => translate(value) ?? "-",
		},
		{
			title: "更新频次3",
			dataIndex: "updateFrequency3",
			// 方式3：自定义渲染
			render: (value, record) => {
				const label = translate(value);
				return label ? <Tag>{label}</Tag> : "-";
			},
		},
	];

	return <ProTable columns={columns} />;
}
```

### 列表数据翻译

```tsx
import { useDict } from "#src/hooks";

function MyComponent() {
	const { translate, translateBatch } = useDict("tag_rule_update_frequency");

	const data = [
		{ id: 1, frequency: "2" },
		{ id: 2, frequency: "3" },
		{ id: 3, frequency: "4" },
	];

	// 方式1：单个翻译
	const translatedData = data.map((item) => ({
		...item,
		frequencyLabel: translate(item.frequency),
	}));

	// 方式2：批量翻译
	const frequencies = data.map((item) => item.frequency);
	const labels = translateBatch(frequencies);

	return (
		<div>
			{data.map((item, index) => (
				<div key={item.id}>
					{item.frequency} → {labels[index]}
				</div>
			))}
		</div>
	);
}
```

## API 参考

### useDict

获取字典数据的 Hook。

#### 参数

- `dictType: string | undefined | null` - 字典类型，如 `'tag_rule_update_frequency'`
- `options?: UseDictOptions` - 可选配置项

#### 返回值

返回 React Query 的查询结果，包含以下字段：

- `data: DictDataItem[] | undefined` - 原始字典数据数组（React Query 标准字段）
- `options: DictOption[] | undefined` - 转换后的选项数组（用于 Select 等组件，保留所有原始字段 + label/value）
- `valueMap: Map<string, DictDataItem>` - 根据 value 查找字典项的 Map
- `labelMap: Map<string, DictDataItem>` - 根据 label 查找字典项的 Map
- `codeMap: Map<number, DictDataItem>` - 根据 dictCode 查找字典项的 Map
- `getLabel: (value: string) => string | undefined` - 根据 value 获取 label
- `getValue: (label: string) => string | undefined` - 根据 label 获取 value
- `getItem: (value: string) => DictDataItem | undefined` - 根据 value 获取完整字典项
- `getItemByCode: (code: number) => DictDataItem | undefined` - 根据 dictCode 获取字典项
- `getItemByLabel: (label: string) => DictDataItem | undefined` - 根据 label 获取字典项
- `findByValue: (value: string) => DictDataItem | undefined` - 根据 value 查找（数组方法）
- `findByLabel: (label: string) => DictDataItem | undefined` - 根据 label 查找（数组方法）
- `findByCode: (code: number) => DictDataItem | undefined` - 根据 dictCode 查找
- `translate: (value: string | null | undefined) => string | undefined` - 翻译方法，根据 value 获取 label（用于列表渲染）
- `translateBatch: (values: (string | null | undefined)[]) => (string | undefined)[]` - 批量翻译，根据 value 数组获取 label 数组
- `renderLabel: (value: string | null | undefined) => React.ReactNode` - 表格列渲染函数，直接用于 ProColumns 的 render
- `isLoading: boolean` - 是否正在加载
- `isError: boolean` - 是否加载错误
- `error: Error | null` - 错误信息
- `refetch: () => void` - 重新获取数据
- 其他 React Query 标准属性（`isFetching`, `isSuccess`, `dataUpdatedAt` 等）

### UseDictOptions

```typescript
interface UseDictOptions extends Omit<UseQueryOptions<DictDataItem[]>, "queryKey" | "queryFn"> {
	/**
	 * 是否禁用所有选项（默认：false）
	 */
	disabled?: boolean;
}
```

支持所有 React Query 的 `UseQueryOptions` 配置项，如：

- `enabled?: boolean` - 是否启用查询
- `staleTime?: number` - 数据新鲜时间（毫秒）
- `gcTime?: number` - 缓存保留时间（毫秒）
- 等等...

### 工具函数

#### transformDictToOptions

将字典数据转换为选项格式。

```typescript
function transformDictToOptions(
	data: DictDataItem[] | undefined,
	disabled?: boolean,
): DictOption[] | undefined;
```

**参数：**

- `data` - 原始字典数据数组
- `disabled` - 是否禁用所有选项（默认：false）

**返回：** 转换后的选项数组

**示例：**

```tsx
const { data } = useDict("tag_rule_update_frequency");
const options = transformDictToOptions(data, false);
```

#### createDictMaps

创建字典查找 Map 的工具函数（用于非 Hook 场景）。

```typescript
function createDictMaps(data: DictDataItem[] | undefined): {
	valueMap: Map<string, DictDataItem>;
	labelMap: Map<string, DictDataItem>;
	codeMap: Map<number, DictDataItem>;
};
```

**注意：** 在组件中使用时，建议直接使用 `useDict` Hook 返回的 `valueMap`、`labelMap`、`codeMap` 字段，无需手动调用此函数。

## 类型定义

### DictDataItem

原始字典数据项类型，包含所有字段：

```typescript
interface DictDataItem {
	/** 字典编码（主键） */
	dictCode: number;
	/** 字典排序 */
	dictSort: number;
	/** 字典标签 */
	dictLabel: string;
	/** 字典键值 */
	dictValue: string;
	/** 字典类型 */
	dictType: string;
	/** 样式属性（其他样式扩展） */
	cssClass: string | null;
	/** 表格回显样式 */
	listClass: string | null;
	/** 是否默认（Y是 N否） */
	isDefault: "Y" | "N";
	/** 状态（0正常 1停用） */
	status: "0" | "1";
	/** 创建者 */
	createBy: string | null;
	/** 创建时间 */
	createTime: string | null;
	/** 更新者 */
	updateBy: string | null;
	/** 更新时间 */
	updateTime: string | null;
	/** 备注 */
	remark: string | null;
	/** API 序列化时添加的字段（不在数据库表中） */
	params?: {
		"@type": string;
	};
	/** 前端计算字段：isDefault === "Y" */
	default?: boolean;
}
```

### DictOption

转换后的选项类型，用于 Select 等组件：

- 保留所有原始字段（DictDataItem 的所有字段）
- 额外添加 `label` 和 `value` 字段（映射自 `dictLabel` 和 `dictValue`）
- 添加 `disabled` 字段（根据 `status` 自动计算）

```typescript
interface DictOption extends DictDataItem {
	label: string; // 映射自 dictLabel
	value: string; // 映射自 dictValue
	disabled?: boolean; // 根据 status 计算
}
```

**示例：**

```tsx
const { options } = useDict("tag_rule_update_frequency");
// options[0] 包含：
// {
//   dictCode: 119,
//   dictLabel: "无",
//   dictValue: "1",
//   dictSort: 0,
//   status: "0",
//   // ... 所有其他原始字段
//   label: "无",  // 新增字段
//   value: "1",   // 新增字段
//   disabled: false  // 新增字段
// }
```

## 注意事项

1. **数据缓存**：字典数据默认缓存 5 分钟，在此期间不会重复请求
2. **状态过滤**：`status !== "0"` 的字典项会被自动标记为 `disabled`
3. **空值处理**：当 `dictType` 为 `undefined` 或 `null` 时，不会发起请求
4. **类型安全**：建议使用 TypeScript 以获得完整的类型提示

## 完整示例

### 基础使用

```tsx
import { useDict } from "#src/hooks";
import { Select, Button } from "antd";

function DictExample() {
	const { data, options, valueMap, isLoading, refetch } = useDict("tag_rule_update_frequency");

	const handleGetLabel = (value: string) => {
		const item = valueMap.get(value);
		console.log(`Value "${value}" 对应的 Label: ${item?.dictLabel}`);
	};

	return (
		<div>
			<Select
				options={options}
				loading={isLoading}
				placeholder="请选择更新频次"
				onChange={(value) => handleGetLabel(value)}
			/>
			<Button onClick={() => refetch()}>刷新字典</Button>
			<div>字典项数量: {data?.length || 0}</div>
		</div>
	);
}
```

### 表格列翻译（最常用）

```tsx
import { useDict } from "#src/hooks";
import type { ProColumns } from "@ant-design/pro-components";
import { ProTable } from "@ant-design/pro-components";

interface MyDataType {
	id: number;
	name: string;
	updateFrequency: string;
}

function TableExample() {
	const { renderLabel, translate } = useDict("tag_rule_update_frequency");

	const columns: ProColumns<MyDataType>[] = [
		{
			title: "ID",
			dataIndex: "id",
		},
		{
			title: "名称",
			dataIndex: "name",
		},
		{
			title: "更新频次",
			dataIndex: "updateFrequency",
			// 推荐：直接使用 renderLabel，自动处理空值
			render: renderLabel,
		},
	];

	return <ProTable columns={columns} />;
}
```

### 列表数据批量翻译

```tsx
import { useDict } from "#src/hooks";

function ListExample() {
	const { translate, translateBatch } = useDict("tag_rule_update_frequency");

	const listData = [
		{ id: 1, frequency: "2" },
		{ id: 2, frequency: "3" },
		{ id: 3, frequency: null },
	];

	// 批量翻译
	const labels = translateBatch(listData.map((item) => item.frequency));
	// ['日', '月', undefined]

	return (
		<ul>
			{listData.map((item, index) => (
				<li key={item.id}>
					频率值: {item.frequency} → 显示: {labels[index] ?? "-"}
				</li>
			))}
		</ul>
	);
}
```
