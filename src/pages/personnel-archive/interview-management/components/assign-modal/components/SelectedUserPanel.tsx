/**
 * 已选用户面板组件
 * 显示当前任务已选择的用户
 */

import type { OrganizationTreeNode } from "#src/api/common";
import type { UserInfo } from "#src/api/personnel-archive/common";

import { CloseOutlined } from "@ant-design/icons";
import { Button, Empty } from "antd";

/**
 * 已选用户面板属性接口
 */
interface SelectedUserPanelProps {
	/** 已选用户 */
	selectedUser?: UserInfo;
	/** 清空回调 */
	onClear: () => void;
	/** 构建部门路径 */
	buildDeptPath: (deptId: number, nodes: OrganizationTreeNode[]) => string;
	/** 组织树数据 */
	treeData: OrganizationTreeNode[];
}

/**
 * 已选用户面板组件
 *
 * @param props - 组件属性
 */
export function SelectedUserPanel({
	selectedUser,
	onClear,
	buildDeptPath,
	treeData,
}: SelectedUserPanelProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="mb-4 flex h-8 items-center justify-between">
				<span>
					已选(
					{selectedUser ? 1 : 0})
				</span>
				{selectedUser && (
					<Button type="link" size="small" onClick={onClear}>
						清空
					</Button>
				)}
			</div>
			<div className="min-h-0 flex-1 overflow-auto">
				{selectedUser ? (
					<div className="flex items-start justify-between rounded bg-gray-50 p-2">
						<div className="flex-1">
							<div className="mb-1 font-medium">{selectedUser.name}</div>
							<div className="text-sm text-gray-500">
								{buildDeptPath(selectedUser.deptId, treeData) ||
									selectedUser.deptName ||
									""}
							</div>
						</div>
						<Button
							type="text"
							size="small"
							icon={<CloseOutlined />}
							onClick={onClear}
							className="text-gray-500 hover:text-gray-700"
						/>
					</div>
				) : (
					<Empty description="暂无已选人员" image={Empty.PRESENTED_IMAGE_SIMPLE} />
				)}
			</div>
		</div>
	);
}
