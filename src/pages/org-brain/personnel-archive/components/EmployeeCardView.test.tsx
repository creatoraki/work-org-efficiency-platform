import type { PersonnelArchiveItem } from "#src/api/org-brain/personnel-archive";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EmployeeCardView } from "./EmployeeCardView";

/**
 * 创建人员档案卡片测试数据。
 *
 * @param userId - 用户ID。
 * @param name   - 员工姓名。
 * @returns 人员档案列表项。
 *
 * @author 王善能
 * @since 2026-07-17
 */
function createEmployee(userId: string, name: string): PersonnelArchiveItem {
	return {
		userId,
		name,
		userCode: `CODE-${userId}`,
		orgId: "org-1",
		orgName: "测试组织",
		jobId: "job-1",
		jobName: "测试岗位",
		postId: "post-1",
		postName: "测试职位",
		joinDate: "2026-07-17",
	};
}

describe("employeeCardView", () => {
	it("分页请求期间应保留旧数据与分页器，并在新数据到达后同步结束加载", () => {
		const onChange = vi.fn();
		const oldEmployee = createEmployee("old", "旧页员工");
		const newEmployee = createEmployee("new", "新页员工");
		const { container, rerender } = render(
			<EmployeeCardView
				dataSource={[oldEmployee]}
				loading
				pagination={{ current: 2, pageSize: 10, total: 30, onChange }}
			/>,
		);

		expect(screen.getByText("旧页员工")).toBeInTheDocument();
		expect(container.querySelector(".ant-pagination")).toBeInTheDocument();
		expect(container.querySelector(".ant-spin-spinning")).toBeInTheDocument();

		rerender(
			<EmployeeCardView
				dataSource={[newEmployee]}
				loading={false}
				pagination={{ current: 3, pageSize: 10, total: 30, onChange }}
			/>,
		);

		expect(screen.queryByText("旧页员工")).not.toBeInTheDocument();
		expect(screen.getByText("新页员工")).toBeInTheDocument();
		expect(container.querySelector(".ant-pagination")).toBeInTheDocument();
		expect(container.querySelector(".ant-spin-spinning")).not.toBeInTheDocument();
	});

	it("首次加载时不应同时展示空状态", () => {
		const { container } = render(
			<EmployeeCardView
				dataSource={[]}
				loading
				pagination={{ current: 1, total: 0, onChange: vi.fn() }}
			/>,
		);

		expect(screen.queryByText("暂无数据")).not.toBeInTheDocument();
		expect(container.querySelector(".ant-spin-spinning")).toBeInTheDocument();
		expect(container.querySelector(".ant-pagination")).toBeInTheDocument();
	});

	it("无缓存数据加载失败时应展示错误状态并支持重试", () => {
		const onRetry = vi.fn();
		render(
			<EmployeeCardView
				dataSource={[]}
				loadFailed
				onRetry={onRetry}
				pagination={{ current: 1, total: 0, onChange: vi.fn() }}
			/>,
		);

		expect(screen.getByText("人员档案加载失败，请稍后重试")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
		expect(onRetry).toHaveBeenCalledTimes(1);
	});
});
