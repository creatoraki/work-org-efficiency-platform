import type { DeploymentQualityStaffItem } from "#src/api/org-brain/deployment/calculate-deployment-quality-score";
import {
	calculateDeploymentQualityScore,
	formatDeploymentQualityScore,
	roundDeploymentQualityScore,
} from "#src/api/org-brain/deployment/calculate-deployment-quality-score";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// 测试数据构造
// ---------------------------------------------------------------------------

/** 构造项目经理 */
function buildPm(
	matchScore: number,
	overrides: Partial<DeploymentQualityStaffItem> = {},
): DeploymentQualityStaffItem {
	return {
		departmentLine: "项目管理",
		positionName: "项目经理",
		matchScore,
		...overrides,
	};
}

/** 构造条线主管 */
function buildManager(
	line: string,
	matchScore: number,
	overrides: Partial<DeploymentQualityStaffItem> = {},
): DeploymentQualityStaffItem {
	return {
		departmentLine: line,
		isManager: 1,
		matchScore,
		...overrides,
	};
}

/** 构造条线一线 */
function buildStaff(
	line: string,
	matchScore: number,
	overrides: Partial<DeploymentQualityStaffItem> = {},
): DeploymentQualityStaffItem {
	return {
		departmentLine: line,
		isManager: 0,
		matchScore,
		...overrides,
	};
}

/** 场景① 标准完整配置（全员同分） */
function buildStandardFullStaff(matchScore: number): DeploymentQualityStaffItem[] {
	return [
		buildPm(matchScore),
		buildManager("客服", matchScore, { positionName: "客服主管" }),
		buildManager("工程", matchScore, { positionName: "工程管理" }),
		buildManager("保洁", matchScore, { positionName: "环境管理" }),
		buildManager("安全", matchScore, { positionName: "安全主管" }),
		buildStaff("客服", matchScore, { positionName: "一星客服管家" }),
		buildStaff("工程", matchScore, { positionName: "一星维修" }),
	];
}

/** 断言质量分 */
function expectScore(staff: DeploymentQualityStaffItem[], expected: number) {
	expect(calculateDeploymentQualityScore(staff)).toBe(expected);
}

// ---------------------------------------------------------------------------
// 场景① 标准完整配置：PM50% + 主管20% + 客服15% + 工程15%
// ---------------------------------------------------------------------------

describe("场景① 标准完整配置", () => {
	it("全员同分 82.9 → 82.9", () => {
		expectScore(buildStandardFullStaff(82.9), 82.9);
	});

	it("全员满分 → 100", () => {
		expectScore(buildStandardFullStaff(100), 100);
	});

	it("全员零分 → 0", () => {
		expectScore(buildStandardFullStaff(0), 0);
	});

	it("逐权重验算：PM50% + 主管20% + 客服15% + 工程15%", () => {
		expectScore(
			[
				buildPm(90),
				buildManager("客服", 80),
				buildManager("工程", 70),
				buildManager("保洁", 60),
				buildManager("安全", 50),
				buildStaff("客服", 80),
				buildStaff("工程", 70),
			],
			80.5,
		);
	});

	it("同条线多人均分后再加权", () => {
		expectScore(
			[
				buildPm(100),
				buildManager("客服", 100),
				buildManager("工程", 100),
				buildManager("保洁", 100),
				buildManager("安全", 100),
				buildStaff("客服", 60),
				buildStaff("客服", 100),
				buildStaff("工程", 80),
				buildStaff("工程", 100),
			],
			95.5,
		);
	});

	it("缺客服主管 → 客服 5% 并入客服一线", () => {
		expectScore(
			[
				buildPm(80),
				buildManager("工程", 90),
				buildManager("保洁", 90),
				buildManager("安全", 90),
				buildStaff("客服", 70),
				buildStaff("工程", 80),
			],
			79.5,
		);
	});

	it("缺工程主管 → 工程 5% 并入工程一线", () => {
		expectScore(
			[
				buildPm(80),
				buildManager("客服", 90),
				buildManager("保洁", 90),
				buildManager("安全", 90),
				buildStaff("客服", 70),
				buildStaff("工程", 80),
			],
			80,
		);
	});

	it("缺保洁主管 → 保洁 5% 权重归零（无保洁一线）", () => {
		expectScore(
			[
				buildPm(100),
				buildManager("客服", 100),
				buildManager("工程", 100),
				buildManager("安全", 100),
				buildStaff("客服", 100),
				buildStaff("工程", 100),
			],
			95,
		);
	});

	it("缺安全主管 → 安全 5% 权重归零", () => {
		expectScore(
			[
				buildPm(100),
				buildManager("客服", 100),
				buildManager("工程", 100),
				buildManager("保洁", 100),
				buildStaff("客服", 100),
				buildStaff("工程", 100),
			],
			95,
		);
	});

	it("缺客服一线但有客服主管 → 15% 并入客服主管", () => {
		expectScore(
			[
				buildPm(80),
				buildManager("客服", 90),
				buildManager("工程", 90),
				buildManager("保洁", 90),
				buildManager("安全", 90),
				buildStaff("工程", 80),
			],
			83.5,
		);
	});

	it("缺工程一线但有工程主管 → 15% 并入工程主管", () => {
		expectScore(
			[
				buildPm(80),
				buildManager("客服", 90),
				buildManager("工程", 90),
				buildManager("保洁", 90),
				buildManager("安全", 90),
				buildStaff("客服", 80),
			],
			83.5,
		);
	});

	it("客服/工程主管均缺 → 5% 并入同条线一线", () => {
		expectScore(
			[
				buildPm(100),
				buildManager("保洁", 100),
				buildManager("安全", 100),
				buildStaff("客服", 100),
				buildStaff("工程", 100),
			],
			100,
		);
	});

	it("仅部分条线有主管时仍走场景①（有客服/工程一线 + 有主管）", () => {
		expectScore(
			[buildPm(80), buildManager("客服", 90), buildStaff("客服", 70), buildStaff("工程", 60)],
			// PM40 + 客服主管4.5+客服一线10.5 + 工程一线(5%+15%)×60=12 → 67
			67,
		);
	});
});

// ---------------------------------------------------------------------------
// 场景② 无条线主管：PM50% + 客服20% + 工程20% + 保洁5% + 安全5%
// ---------------------------------------------------------------------------

describe("场景② 无条线主管", () => {
	it("全员同分 80 → 80", () => {
		expectScore(
			[
				buildPm(80),
				buildStaff("客服", 80),
				buildStaff("工程", 80),
				buildStaff("保洁", 80),
				buildStaff("安全", 80),
			],
			80,
		);
	});

	it("逐权重验算", () => {
		expectScore(
			[
				buildPm(100),
				buildStaff("客服", 60),
				buildStaff("工程", 80),
				buildStaff("保洁", 50),
				buildStaff("安全", 90),
			],
			85,
		);
	});

	it("仅客服/工程一线、缺保洁/安全 → 对应 5% 归零", () => {
		expectScore([buildPm(100), buildStaff("客服", 100), buildStaff("工程", 100)], 90);
	});

	it("仅客服一线（无工程/保洁/安全）", () => {
		expectScore([buildPm(100), buildStaff("客服", 50)], 60);
	});

	it("仅工程一线", () => {
		expectScore([buildPm(100), buildStaff("工程", 75)], 65);
	});

	it("客服/工程各多人均分", () => {
		expectScore(
			[
				buildPm(100),
				buildStaff("客服", 40),
				buildStaff("客服", 80),
				buildStaff("工程", 60),
				buildStaff("工程", 100),
				buildStaff("保洁", 100),
				buildStaff("安全", 100),
			],
			// 客服均60×20=12, 工程均80×20=16, 其余50+5+5=60 → 88
			88,
		);
	});

	it("有保洁/安全一线但无主管时各自承担 5%", () => {
		expectScore(
			[
				buildPm(80),
				buildStaff("客服", 70),
				buildStaff("工程", 70),
				buildStaff("保洁", 90),
				buildStaff("安全", 60),
			],
			// 40+14+14+4.5+3=75.5
			75.5,
		);
	});
});

// ---------------------------------------------------------------------------
// 场景③ 无客服/工程一线：PM50% + 主管50%
// ---------------------------------------------------------------------------

describe("场景③ 无客服/工程一线", () => {
	it("逐权重验算：客服主管20% + 工程主管20% + 保洁5% + 安全5%", () => {
		expectScore(
			[
				buildPm(90),
				buildManager("客服", 80),
				buildManager("工程", 70),
				buildManager("保洁", 60),
				buildManager("安全", 50),
			],
			80.5,
		);
	});

	it("全员同分 82.9 → 82.9", () => {
		expectScore(
			[
				buildPm(82.9),
				buildManager("客服", 82.9),
				buildManager("工程", 82.9),
				buildManager("保洁", 82.9),
				buildManager("安全", 82.9),
			],
			82.9,
		);
	});

	it("缺保洁主管 → 保洁 5% 归零", () => {
		expectScore(
			[
				buildPm(100),
				buildManager("客服", 100),
				buildManager("工程", 100),
				buildManager("安全", 100),
			],
			95,
		);
	});

	it("缺安全主管 → 安全 5% 归零", () => {
		expectScore(
			[
				buildPm(100),
				buildManager("客服", 100),
				buildManager("工程", 100),
				buildManager("保洁", 100),
			],
			95,
		);
	});

	it("缺客服主管 → 客服 20% 归零", () => {
		expectScore(
			[
				buildPm(100),
				buildManager("工程", 100),
				buildManager("保洁", 100),
				buildManager("安全", 100),
			],
			80,
		);
	});

	it("仅有 PM + 四主管、无保洁/安全主管", () => {
		expectScore(
			[buildPm(70), buildManager("客服", 80), buildManager("工程", 90)],
			// 35+16+18=69
			69,
		);
	});

	it("有保洁/安全一线但不影响场景③判定（仍只计主管）", () => {
		expectScore(
			[
				buildPm(80),
				buildManager("客服", 90),
				buildManager("工程", 90),
				buildManager("保洁", 90),
				buildManager("安全", 90),
				buildStaff("保洁", 100),
				buildStaff("安全", 100),
			],
			// 场景③路径，保洁/安全一线不计入 → 85
			85,
		);
	});
});

// ---------------------------------------------------------------------------
// 场景④ 仅有项目经理：PM50%
// ---------------------------------------------------------------------------

describe("场景④ 仅有项目经理", () => {
	it("pM 82.9 → 41.45", () => {
		expectScore([buildPm(82.9)], 41.45);
	});

	it("pM 满分 → 50（不归一化）", () => {
		expectScore([buildPm(100)], 50);
	});

	it("pM 零分 → 0", () => {
		expectScore([buildPm(0)], 0);
	});

	it("有 PM + 保洁/安全一线 → 仍仅计 PM50%（走场景④）", () => {
		expectScore([buildPm(80), buildStaff("保洁", 100), buildStaff("安全", 100)], 40);
	});

	it("有 PM + 仅保洁主管 → 走场景③（PM50% + 保洁主管5%）", () => {
		expectScore([buildPm(80), buildManager("保洁", 100)], 45);
	});

	it("多名 PM 均分后乘 50%", () => {
		expectScore([buildPm(80), buildPm(60)], 35);
	});
});

// ---------------------------------------------------------------------------
// 场景⑤ 无项目经理：主管20% + 客服15% + 工程15%
// ---------------------------------------------------------------------------

describe("场景⑤ 无项目经理", () => {
	it("完整配置满分 → 50（不归一化）", () => {
		expectScore(
			[
				buildManager("客服", 100),
				buildManager("工程", 100),
				buildManager("保洁", 100),
				buildManager("安全", 100),
				buildStaff("客服", 100),
				buildStaff("工程", 100),
			],
			50,
		);
	});

	it("逐权重验算", () => {
		expectScore(
			[
				buildManager("客服", 80),
				buildManager("工程", 70),
				buildManager("保洁", 60),
				buildManager("安全", 50),
				buildStaff("客服", 90),
				buildStaff("工程", 60),
			],
			35.5,
		);
	});

	it("缺客服主管 → 客服 5% 并入客服一线", () => {
		expectScore(
			[
				buildManager("工程", 100),
				buildManager("保洁", 100),
				buildManager("安全", 100),
				buildStaff("客服", 80),
				buildStaff("工程", 60),
			],
			40,
		);
	});

	it("缺工程主管 → 工程 5% 并入工程一线", () => {
		expectScore(
			[
				buildManager("客服", 100),
				buildManager("保洁", 100),
				buildManager("安全", 100),
				buildStaff("客服", 80),
				buildStaff("工程", 60),
			],
			39,
		);
	});

	it("缺客服一线但有客服主管 → 15% 并入主管", () => {
		expectScore(
			[
				buildManager("客服", 70),
				buildManager("工程", 80),
				buildManager("保洁", 80),
				buildManager("安全", 90),
				buildStaff("工程", 60),
			],
			35.5,
		);
	});

	it("仅保洁主管", () => {
		expectScore([buildManager("保洁", 90)], 4.5);
	});

	it("仅安全一线", () => {
		expectScore([buildStaff("安全", 80)], 4);
	});

	it("仅客服一线+工程一线（无主管）", () => {
		expectScore([buildStaff("客服", 70), buildStaff("工程", 60)], 26);
	});

	it("仅有保洁一线 big.js 四舍五入", () => {
		const scores = [81, 97, 68, 84, 60, 79, 85, 83, 73, 97, 82];
		expectScore(
			scores.map((matchScore) => buildStaff("保洁", matchScore)),
			4.04,
		);
	});

	it("完全无文档条线人员 → 0", () => {
		expectScore([], 0);
	});
});

// ---------------------------------------------------------------------------
// 场景判定优先级（通过分数间接验证路由）
// ---------------------------------------------------------------------------

describe("场景判定优先级", () => {
	it("无 PM → 始终场景⑤，即使有完整主管+一线", () => {
		expectScore(
			[
				buildManager("客服", 100),
				buildManager("工程", 100),
				buildStaff("客服", 100),
				buildStaff("工程", 100),
			],
			40,
		);
	});

	it("有 PM + 无客服/工程一线 + 有主管 → 场景③", () => {
		expectScore([buildPm(100), buildManager("客服", 100), buildManager("工程", 100)], 90);
	});

	it("有 PM + 无客服/工程一线 + 无主管 → 场景④", () => {
		expectScore([buildPm(80), buildStaff("保洁", 100)], 40);
	});

	it("有 PM + 有客服/工程一线 + 无主管 → 场景②", () => {
		expectScore([buildPm(100), buildStaff("客服", 100)], 70);
	});

	it("有 PM + 有客服/工程一线 + 有主管 → 场景①", () => {
		expectScore([buildPm(100), buildManager("客服", 100), buildStaff("客服", 100)], 70);
	});
});

// ---------------------------------------------------------------------------
// 通用补充规则
// ---------------------------------------------------------------------------

describe("通用补充规则", () => {
	it("无主管 → 5% 分摊至本条线全体一线", () => {
		expectScore([buildPm(100), buildStaff("客服", 50)], 60);
	});

	it("无一线 → 15% 平移至同条线主管（客服）", () => {
		expectScore(
			[
				buildPm(100),
				buildManager("客服", 80),
				buildManager("工程", 100),
				buildManager("保洁", 100),
				buildManager("安全", 100),
				buildStaff("工程", 100),
			],
			96,
		);
	});

	it("无一线 → 15% 平移至同条线主管（工程）", () => {
		expectScore(
			[
				buildPm(100),
				buildManager("客服", 100),
				buildManager("工程", 75),
				buildManager("保洁", 100),
				buildManager("安全", 100),
				buildStaff("客服", 100),
			],
			95,
		);
	});

	it("全岗位无人 → 该板块权重归零", () => {
		expectScore([buildPm(100), buildManager("保洁", 100), buildManager("安全", 100)], 60);
	});
});

// ---------------------------------------------------------------------------
// 人员角色识别
// ---------------------------------------------------------------------------

describe("人员角色识别", () => {
	it("条线=项目管理 → 项目经理", () => {
		expectScore([buildPm(60)], 30);
	});

	it("条线=项目经理 → 项目经理", () => {
		expectScore([{ departmentLine: "项目经理", matchScore: 80 }], 40);
	});

	it("岗位名含项目经理 → 项目经理（不计入条线主管）", () => {
		expectScore(
			[
				{
					departmentLine: "工程",
					positionName: "项目经理",
					isManager: 1,
					matchScore: 80,
				},
			],
			40,
		);
	});

	it("项目管理条线 + isManager=1 仍视为 PM 而非主管", () => {
		expectScore([{ departmentLine: "项目管理", isManager: 1, matchScore: 80 }], 40);
	});
});

// ---------------------------------------------------------------------------
// isManager 字段兼容
// ---------------------------------------------------------------------------

describe("isManager 字段兼容", () => {
	it("isManager=1 → 主管", () => {
		expectScore([buildManager("保洁", 100, { isManager: 1 })], 5);
	});

	it("isManager=true → 主管", () => {
		expectScore([buildManager("保洁", 100, { isManager: true })], 5);
	});

	it("isManager=0 → 一线", () => {
		expectScore([buildStaff("保洁", 100, { isManager: 0 })], 5);
	});

	it("isManager=false → 一线", () => {
		expectScore([buildStaff("保洁", 100, { isManager: false })], 5);
	});

	it("isManager=null → 一线（后端真实返回）", () => {
		expectScore([{ departmentLine: "保洁", isManager: null, matchScore: 100 }], 5);
	});

	it("isManager 缺失 → 一线", () => {
		expectScore([{ departmentLine: "保洁", matchScore: 100 }], 5);
	});
});

// ---------------------------------------------------------------------------
// 非文档条线（不参与计算）
// ---------------------------------------------------------------------------

describe("非文档条线（不参与计算）", () => {
	const extraLines = ["E.O", "绿化", "其他服务", "多经业务", "项目业务支撑"];

	it.each(extraLines)("%s 人员不计入质量分", (line) => {
		expectScore([buildPm(80), buildStaff(line, 100)], 40);
	});

	it("大量非文档条线混合也不影响", () => {
		expectScore(
			[
				buildPm(100),
				buildStaff("客服", 100),
				buildStaff("工程", 100),
				buildStaff("E.O", 100),
				buildStaff("绿化", 100),
				buildStaff("其他服务", 100),
				buildStaff("多经业务", 100),
			],
			90,
		);
	});

	it("仅非文档条线人员 → 0", () => {
		expectScore([buildStaff("绿化", 100), buildStaff("E.O", 90)], 0);
	});
});

// ---------------------------------------------------------------------------
// 历史别名兼容
// ---------------------------------------------------------------------------

describe("历史别名兼容", () => {
	it("管家 → 客服（一线）", () => {
		expectScore(
			[
				buildPm(100),
				buildManager("客服", 100),
				buildManager("工程", 100),
				buildManager("保洁", 100),
				buildManager("安全", 100),
				{ departmentLine: "管家", isManager: 0, matchScore: 100 },
				buildStaff("工程", 100),
			],
			100,
		);
	});

	it("环境 → 保洁（主管）", () => {
		expectScore(
			[
				buildPm(100),
				buildManager("客服", 100),
				buildManager("工程", 100),
				buildManager("保洁", 100),
				buildManager("安全", 100),
				buildStaff("客服", 100),
				buildStaff("工程", 100),
				{ departmentLine: "环境", isManager: 1, matchScore: 60 },
			],
			99,
		);
	});

	it("环境 → 保洁（一线）", () => {
		expectScore([{ departmentLine: "环境", isManager: null, matchScore: 80 }], 4);
	});

	it("条线名首尾空格会被 trim", () => {
		expectScore([{ departmentLine: "  保洁  ", isManager: null, matchScore: 100 }], 5);
	});
});

// ---------------------------------------------------------------------------
// 真实后端数据：陕西·西安·软件园
// ---------------------------------------------------------------------------

describe("真实后端数据：陕西·西安·软件园", () => {
	describe("requestId=335：仅保洁一线", () => {
		const solution1Scores = [57, 96, 55, 90, 71, 73, 96, 98, 93, 83, 96];
		const solution2Scores = [96, 55, 90, 71, 73, 96, 98, 93, 83, 50, 85];

		const buildCleaningOnlyStaff = (scores: number[]): DeploymentQualityStaffItem[] =>
			scores.map((matchScore) => ({
				departmentLine: "保洁",
				positionName: "保洁员",
				isManager: null,
				matchScore,
			}));

		it("方案1：11名保洁员 → 4.13", () => {
			expectScore(buildCleaningOnlyStaff(solution1Scores), 4.13);
		});

		it("方案2：替换末位人员 → 4.05", () => {
			expectScore(buildCleaningOnlyStaff(solution2Scores), 4.05);
		});
	});

	describe("requestId=336：保洁一线 + 工程主管（无项目经理）", () => {
		const solution1Cleaning = [70, 59, 78, 99, 96, 80, 85, 78, 50, 92, 55];
		const solution1EngManagers = [61, 69, 98, 61, 52];
		const solution2Cleaning = [59, 78, 99, 96, 80, 85, 78, 50, 92, 79, 59];
		const solution2EngManagers = [85, 69, 98, 61, 52];

		const buildMixedStaff = (
			cleaningScores: number[],
			engManagerScores: number[],
		): DeploymentQualityStaffItem[] => [
			...cleaningScores.map((matchScore) => ({
				departmentLine: "保洁",
				positionName: "保洁员",
				isManager: null,
				matchScore,
			})),
			...engManagerScores.map((matchScore) => ({
				departmentLine: "工程",
				positionName: "工程经理",
				isManager: 1,
				matchScore,
			})),
		];

		it("方案1：工程主管20% + 保洁5% → 17.47", () => {
			expectScore(buildMixedStaff(solution1Cleaning, solution1EngManagers), 17.47);
		});

		it("方案2：替换工程主管首位 → 18.49", () => {
			expectScore(buildMixedStaff(solution2Cleaning, solution2EngManagers), 18.49);
		});
	});

	describe("requestId=337：项目管理 + 工程主管 + 保洁一线", () => {
		const solution1Pm = [77, 90, 73, 83, 82];
		const solution2Pm = [90, 73, 83, 56, 82];
		const solution1EngManagers = [58, 83, 65, 57, 75];
		const solution2EngManagers = [73, 83, 65, 57, 75];
		const solution1Cleaning = [67, 66, 88, 88, 97, 95, 80, 60, 58, 56, 75];
		const solution2Cleaning = [66, 88, 88, 97, 95, 80, 60, 58, 56, 70, 62];

		const buildFullStaff = (
			pmScores: number[],
			engManagerScores: number[],
			cleaningScores: number[],
		): DeploymentQualityStaffItem[] => [
			...pmScores.map((matchScore) => ({
				departmentLine: "项目管理",
				positionName: "项目助理经理",
				isManager: null,
				matchScore,
			})),
			...engManagerScores.map((matchScore) => ({
				departmentLine: "工程",
				positionName: "工程经理",
				isManager: 1,
				matchScore,
			})),
			...cleaningScores.map((matchScore) => ({
				departmentLine: "保洁",
				positionName: "保洁员",
				isManager: null,
				matchScore,
			})),
		];

		it("方案1：场景③ PM50% + 工程主管20% → 54.02（保洁不计入）", () => {
			expectScore(
				buildFullStaff(solution1Pm, solution1EngManagers, solution1Cleaning),
				54.02,
			);
		});

		it("方案2：替换 PM/工程主管首位 → 52.52", () => {
			expectScore(
				buildFullStaff(solution2Pm, solution2EngManagers, solution2Cleaning),
				52.52,
			);
		});

		it("条线=项目管理 的项目助理经理计入 PM 权重（非工程主管）", () => {
			expectScore(
				[{ departmentLine: "项目管理", positionName: "项目助理经理", matchScore: 80 }],
				40,
			);
		});
	});

	it("isManager=null 视为一线人员（非主管）", () => {
		expectScore([{ departmentLine: "保洁", isManager: null, matchScore: 100 }], 5);
	});

	it("方案1 加一名非文档条线人员不影响分数", () => {
		const solution1Scores = [57, 96, 55, 90, 71, 73, 96, 98, 93, 83, 96];
		const staff = solution1Scores.map((matchScore) => ({
			departmentLine: "保洁",
			positionName: "保洁员",
			isManager: null,
			matchScore,
		}));
		expectScore([...staff, buildStaff("绿化", 100)], 4.13);
	});
});

// ---------------------------------------------------------------------------
// 边界值与格式化
// ---------------------------------------------------------------------------

describe("边界值与格式化", () => {
	it("空人员列表 → 0", () => {
		expectScore([], 0);
	});

	it("缺失 matchScore → 按 0 计", () => {
		expectScore([{ departmentLine: "项目管理", positionName: "项目经理" }], 0);
	});

	it("matchScore=NaN → 按 0 计", () => {
		expectScore([buildPm(Number.NaN)], 0);
	});

	it("matchScore 超 100 → 截断为 100", () => {
		expectScore([buildPm(150)], 50);
	});

	it("matchScore 小于 0 → 截断为 0", () => {
		expectScore([buildPm(-50)], 0);
	});

	it("越界 matchScore 混合截断（场景②）", () => {
		expectScore(
			[
				buildPm(120),
				buildStaff("客服", -50),
				buildStaff("工程", 100.2),
				buildStaff("保洁", 100.2),
				buildStaff("安全", 100.2),
			],
			80,
		);
	});

	it("四舍五入：4.03636... → 4.04", () => {
		expect(roundDeploymentQualityScore(4.036363636363636)).toBe(4.04);
	});

	it("四舍五入：4.125 → 4.13（roundHalfUp）", () => {
		expect(roundDeploymentQualityScore(4.125)).toBe(4.13);
	});

	it("四舍五入：4.124 → 4.12", () => {
		expect(roundDeploymentQualityScore(4.124)).toBe(4.12);
	});

	it("formatDeploymentQualityScore 保留两位小数", () => {
		expect(formatDeploymentQualityScore(82.9)).toBe("82.9");
		expect(formatDeploymentQualityScore(82.905)).toBe("82.91");
		expect(formatDeploymentQualityScore(4.1)).toBe("4.1");
		expect(formatDeploymentQualityScore(50)).toBe("50");
	});
});

// ---------------------------------------------------------------------------
// 参数化：各场景同分快速验算
// ---------------------------------------------------------------------------

describe.each([
	{ label: "场景①", staff: buildStandardFullStaff(82.5), expected: 82.5 },
	{
		label: "场景②",
		staff: [
			buildPm(82.5),
			buildStaff("客服", 82.5),
			buildStaff("工程", 82.5),
			buildStaff("保洁", 82.5),
			buildStaff("安全", 82.5),
		],
		expected: 82.5,
	},
	{
		label: "场景③",
		staff: [
			buildPm(82.5),
			buildManager("客服", 82.5),
			buildManager("工程", 82.5),
			buildManager("保洁", 82.5),
			buildManager("安全", 82.5),
		],
		expected: 82.5,
	},
	{ label: "场景④", staff: [buildPm(82.5)], expected: 41.25 },
	{
		label: "场景⑤",
		staff: [
			buildManager("客服", 82.5),
			buildManager("工程", 82.5),
			buildManager("保洁", 82.5),
			buildManager("安全", 82.5),
			buildStaff("客服", 82.5),
			buildStaff("工程", 82.5),
		],
		expected: 41.25,
	},
])("参数化同分验算：$label", ({ staff, expected }) => {
	it(`全员 82.5 → ${expected}`, () => {
		expectScore(staff, expected);
	});
});
