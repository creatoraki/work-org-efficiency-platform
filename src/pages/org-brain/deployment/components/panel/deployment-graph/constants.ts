import { FIT_VIEW_PADDING } from "../steps";

/** fitView 配置：始终适配、双向居中 */
export const FIT_VIEW_OPTIONS = { when: "always" as const, direction: "both" as const };

/** 初次渲染时 React 节点边界滞后，分次重试视口调整 */
export const FIT_VIEW_RETRY_DELAYS_MS = [0, 80, 180] as const;

/** 头部展开/收起 CSS 动画时长，防抖需覆盖整段过渡 */
export const RESIZE_VIEWPORT_DEBOUNCE_MS = 350;

/** 视口平滑过渡（G6 ViewportAnimationEffectTiming） */
export const VIEWPORT_ANIMATION = { duration: 300, easing: "ease-in-out" as const };

export { FIT_VIEW_PADDING };
