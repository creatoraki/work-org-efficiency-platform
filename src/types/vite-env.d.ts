/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

// https://vitejs.dev/guide/env-and-mode.html#intellisense-for-typescript
interface ImportMetaEnv {
	/** 后端 API 前缀 */
	readonly VITE_API_BASE_URL: string;
	/** 登录之后默认调转的路由 */
	readonly VITE_BASE_HOME_PATH: string;
	/** 网站标题 */
	readonly VITE_GLOB_APP_TITLE: string;
	/** 用于设置 Zustand 存储的前缀标识，解决多项目共存时的命名冲突问题 */
	readonly VITE_APP_NAMESPACE: string;
	/** API 请求超时时间（毫秒） */
	readonly VITE_API_TIMEOUT?: string;
	/** OA 审批系统地址 */
	readonly VITE_OA_BASE_URL: string;
	/** React Router 路由模式（hash | history） */
	readonly VITE_ROUTER_MODE: string;
	/** 应用部署基础路径 */
	readonly VITE_BASE?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
