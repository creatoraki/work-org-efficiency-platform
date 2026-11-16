import blankIcon from "#src/assets/svg/blank.svg";
import { SectionTitle } from "#src/components/section-title/index.js";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Input, Select, Space, Table } from "antd";
import React from "react";

interface Rule {
	id: string;
	subject: string;
	operator: string;
	value: string;
}

interface RuleSet {
	id: string;
	relation: "AND" | "OR";
	rules: Rule[];
}

export default function RuleBuilder() {
	const [ruleSets, setRuleSets] = React.useState<RuleSet[]>([]);
	const [rootRelation, setRootRelation] = React.useState<"AND" | "OR">("AND");

	const createRule = (): Rule => ({
		id: Math.random().toString(36).slice(2),
		subject: "",
		operator: "等于",
		value: "",
	});

	const addRuleSet = () => {
		const newRuleSet: RuleSet = {
			id: Math.random().toString(36).slice(2),
			relation: "AND",
			rules: [createRule()],
		};
		setRuleSets([...ruleSets, newRuleSet]);
	};

	const addRule = (setIndex: number, ruleIndex: number) => {
		const newRuleSets = [...ruleSets];
		const newRule = createRule();
		newRuleSets[setIndex].rules.splice(ruleIndex + 1, 0, newRule);
		setRuleSets(newRuleSets);
	};

	const removeRule = (setIndex: number, ruleIndex: number) => {
		const newRuleSets = [...ruleSets];
		newRuleSets[setIndex].rules.splice(ruleIndex, 1);
		if (newRuleSets[setIndex].rules.length === 0) {
			newRuleSets.splice(setIndex, 1);
		}
		setRuleSets(newRuleSets);
	};

	const updateRule = (setIndex: number, ruleIndex: number, field: keyof Rule, value: any) => {
		const newRuleSets = [...ruleSets];
		newRuleSets[setIndex].rules[ruleIndex] = {
			...newRuleSets[setIndex].rules[ruleIndex],
			[field]: value,
		};
		setRuleSets(newRuleSets);
	};

	const toggleRelation = (setIndex: number) => {
		const newRuleSets = [...ruleSets];
		newRuleSets[setIndex].relation = newRuleSets[setIndex].relation === "AND" ? "OR" : "AND";
		setRuleSets(newRuleSets);
	};

	const toggleRootRelation = () => {
		setRootRelation((prev) => (prev === "AND" ? "OR" : "AND"));
	};

	const columns = [
		{
			title: "序号",
			dataIndex: "index",
			key: "index",
			render: (_: any, __: any, index: number) => index + 1,
		},
		{
			title: "组织名称",
			dataIndex: "orgName",
			key: "orgName",
		},
		{
			title: "主数据编码",
			dataIndex: "masterDataCode",
			key: "masterDataCode",
		},
		{
			title: "组织标签",
			dataIndex: "orgTags",
			key: "orgTags",
		},
		{
			title: "项目类型",
			dataIndex: "projectType",
			key: "projectType",
		},
	];

	const [tableData, setTableData] = React.useState<any[]>([]);

	const handleSearch = () => {
		setTableData([
			{
				id: "1",
				orgName: "研发中心",
				masterDataCode: "MD001",
				orgTags: "技术, 创新",
				projectType: "研发类",
			},
			{
				id: "2",
				orgName: "市场部",
				masterDataCode: "MD002",
				orgTags: "营销, 推广",
				projectType: "市场类",
			},
		]);
	};

	const handleReset = () => {
		setTableData([]);
	};

	return (
		<>
			<div className="flex max-h-[250px] w-full flex-col rounded-lg border border-gray-200 p-4 pt-2">
				{ruleSets.length > 0 && (
					<div className="mb-2 flex items-center justify-between">
						<SectionTitle title="新增规则" />
						<Button type="primary" icon={<PlusOutlined />} onClick={addRuleSet}>
							新增
						</Button>
					</div>
				)}

				<div className="min-h-[200px] flex-1 overflow-auto">
					{ruleSets.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center">
							<div style={{ color: "rgba(144, 147, 153, 1)" }} className="mb-3">
								当前暂无规则
							</div>
							<Button type="primary" icon={<PlusOutlined />} onClick={addRuleSet}>
								新增规则
							</Button>
						</div>
					) : (
						<div className="flex gap-2">
							{/* Root Relation Line */}
							{ruleSets.length > 1 && (
								<div className="relative flex w-10 flex-col items-center">
									<div className="absolute bottom-0 top-0 w-px bg-blue-500"></div>
									<div
										className="absolute top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 cursor-pointer select-none items-center justify-center rounded-full bg-blue-500 text-xs text-white"
										onClick={toggleRootRelation}
									>
										{rootRelation === "AND" ? "且" : "或"}
									</div>
								</div>
							)}

							<div className="flex flex-1 flex-col gap-2">
								{ruleSets.map((ruleSet, setIndex) => (
									<div key={ruleSet.id} className="flex gap-2">
										{/* Relation Line */}
										{ruleSet.rules.length > 1 && (
											<div className="relative flex w-10 flex-col items-center">
												<div className="absolute bottom-0 top-0 w-px bg-blue-500"></div>
												<div
													className="absolute top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 cursor-pointer select-none items-center justify-center rounded-full bg-blue-500 text-xs text-white"
													onClick={() => toggleRelation(setIndex)}
												>
													{ruleSet.relation === "AND" ? "且" : "或"}
												</div>
											</div>
										)}

										<div className="flex flex-1 flex-col gap-1">
											{ruleSet.rules.map((rule, ruleIndex) => (
												<div
													key={rule.id}
													className="flex items-center gap-2 rounded p-1"
												>
													<Input
														placeholder="主体"
														value={rule.subject}
														onChange={(e) =>
															updateRule(
																setIndex,
																ruleIndex,
																"subject",
																e.target.value,
															)
														}
														style={{ width: 140 }}
													/>
													<Select
														value={rule.operator}
														onChange={(val) =>
															updateRule(
																setIndex,
																ruleIndex,
																"operator",
																val,
															)
														}
														style={{ width: 90 }}
													>
														<Select.Option value="等于">
															等于
														</Select.Option>
														<Select.Option value="大于">
															大于
														</Select.Option>
														<Select.Option value="小于">
															小于
														</Select.Option>
													</Select>
													<Input
														placeholder="值"
														value={rule.value}
														onChange={(e) =>
															updateRule(
																setIndex,
																ruleIndex,
																"value",
																e.target.value,
															)
														}
														style={{ flex: 1 }}
													/>

													<div className="ml-2 flex items-center">
														<Space>
															<Button
																type="link"
																size="small"
																onClick={() =>
																	addRule(setIndex, ruleIndex)
																}
															>
																新增
															</Button>
															<Button
																type="link"
																size="small"
																onClick={() =>
																	removeRule(setIndex, ruleIndex)
																}
															>
																删除
															</Button>
														</Space>
													</div>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
			<div className="mt-4 flex flex-col">
				<div className="mb-4 flex items-center justify-end">
					<Space>
						<Button type="primary" onClick={handleSearch}>
							查询
						</Button>
						<Button onClick={handleReset}>重置</Button>
					</Space>
				</div>
				{tableData.length > 0 ? (
					<Table
						columns={columns}
						dataSource={tableData}
						pagination={{ defaultCurrent: 1, total: tableData.length }}
						size="small"
					/>
				) : (
					<div className="flex items-center justify-center">
						<img src={blankIcon} alt="暂无数据" style={{ width: 150, height: 120 }} />
					</div>
				)}
			</div>
		</>
	);
}
