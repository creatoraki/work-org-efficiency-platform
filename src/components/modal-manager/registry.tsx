import type React from "react";
import IndicatorConfigWrapper from "./wrappers/IndicatorConfigWrapper";
import DetailWrapper from "./wrappers/IndicatorDetailWrapper";
// auto-register built-in wrappers via static imports
import DrawerWrapper from "./wrappers/IndicatorDrawerWrapper";
import EditWrapper from "./wrappers/IndicatorEditWrapper";
import PlanWrapper from "./wrappers/IndicatorPlanWrapper";
import PersonCreateWrapper from "./wrappers/PersonCreateWrapper";
import PersonPermissionsWrapper from "./wrappers/PersonPermissionsWrapper";
import PlanCreateWrapper from "./wrappers/PlanCreateWrapper";
import PlanDrawerWrapper from "./wrappers/PlanDrawerWrapper";
import PlanFlowWrapper from "./wrappers/PlanFlowWrapper";
import PlanHistoryWrapper from "./wrappers/PlanHistoryWrapper";
import PlanPermissionsWrapper from "./wrappers/PlanPermissionsWrapper";
import PlanViewDataWrapper from "./wrappers/PlanViewDataWrapper";
import TaskDetailWrapper from "./wrappers/TaskDetailWrapper";

const registry: Record<
	string,
	(opts: {
		id: string;
		props?: any;
		onClose: (res?: any) => void;
		open?: (name: string, props?: any) => Promise<any>;
	}) => React.ReactElement | null
> = {};

export function register(name: string, renderer: (typeof registry)[string]) {
	registry[name] = renderer;
}

export default registry;

try {
	register("indicator.drawer", DrawerWrapper);
} catch (e) {
	console.error("[ModalRegistry] failed to register DrawerWrapper", e);
}

try {
	register("indicator.edit", EditWrapper);
} catch (e) {
	console.error("[ModalRegistry] failed to register EditWrapper", e);
}

try {
	register("indicator.detail", DetailWrapper);
} catch (e) {
	console.error("[ModalRegistry] failed to register DetailWrapper", e);
}

try {
	register("indicator.plan", PlanWrapper);
} catch (e) {
	console.error("[ModalRegistry] failed to register PlanWrapper", e);
}

try {
	register("plan.drawer", PlanDrawerWrapper);
} catch (e) {
	console.error("[ModalRegistry] failed to register PlanDrawerWrapper", e);
}

try {
	register("plan.flow", PlanFlowWrapper);
} catch (e) {
	console.error("[ModalRegistry] failed to register PlanFlowWrapper", e);
}

try {
	register("plan.permissions", PlanPermissionsWrapper);
} catch (e) {
	console.error("[ModalRegistry] failed to register PlanPermissionsWrapper", e);
}

try {
	// register indicator permissions to reuse the same drawer as plan permissions
	register("indicator.permissions", PlanPermissionsWrapper);
} catch (e) {
	console.error("[ModalRegistry] failed to register IndicatorPermissionsWrapper", e);
}

try {
	register("plan.create", PlanCreateWrapper);
} catch (e) {
	console.error("[ModalRegistry] failed to register PlanCreateWrapper", e);
}

try {
	register("plan.viewData", PlanViewDataWrapper);
} catch (e) {
	console.error("[ModalRegistry] failed to register PlanViewDataWrapper", e);
}

try {
	register("task.detail", TaskDetailWrapper);
} catch (e) {
	console.error("[ModalRegistry] failed to register TaskDetailWrapper", e);
}

try {
	register("indicator.config", IndicatorConfigWrapper);
} catch (e) {
	console.error("[ModalRegistry] failed to register IndicatorConfigWrapper", e);
}

try {
	register("plan.history", PlanHistoryWrapper);
} catch (e) {
	console.error("[ModalRegistry] failed to register PlanHistoryWrapper", e);
}

try {
	register("person.create", PersonCreateWrapper);
} catch (e) {
	console.error("[ModalRegistry] failed to register PersonCreateWrapper", e);
}

try {
	register("person.permissions.edit", PersonPermissionsWrapper);
} catch (e) {
	console.error("[ModalRegistry] failed to register PersonPermissionsWrapper", e);
}
