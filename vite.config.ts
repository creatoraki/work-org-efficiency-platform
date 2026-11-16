/// <reference types="vitest/config" />

import http from "node:http";
import { resolve as resolvePath } from "node:path";
import process from "node:process";
import { cleanupSVG, isEmptyColor, parseColors, runSVGO, SVG } from "@iconify/tools";
import react from "@vitejs/plugin-react";
import dayjs from "dayjs";
import { visualizer } from "rollup-plugin-visualizer";
import { FileSystemIconLoader } from "unplugin-icons/loaders";
import Icons from "unplugin-icons/vite";
import { defineConfig, loadEnv } from "vite";
import { checker } from "vite-plugin-checker";
import { vitePluginFakeServer } from "vite-plugin-fake-server";
import svgrPlugin from "vite-plugin-svgr";

import { author, dependencies, devDependencies, license, name, version } from "./package.json";

const __APP_INFO__ = {
	pkg: { dependencies, devDependencies, name, version, license, author },
	lastBuildTime: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
};

const projectRoot = resolvePath(process.cwd());

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	// 加载环境变量；loadEnv 默认只收 VITE_ 前缀，ANALYZE 构建开关需显式声明前缀
	const env = loadEnv(mode, process.cwd(), ["VITE_", "ANALYZE"]);
	// const isDev = mode === "development";
	const useLocalApiProxy = process.env.LOCAL_API_PROXY === "true";

	console.log("mode", mode);

	// 获取基础路径，必须通过环境变量配置
	const base = env.VITE_BASE;
	if (!base) {
		throw new Error(`VITE_BASE 环境变量未设置，请检查 .env.${mode} 配置文件`);
	}

	return {
		base,
		plugins: [
			react({
				jsxRuntime: "automatic",
			}),
			vitePluginFakeServer({
				basename: "/shanshu-efficiency-api",
				// 生产环境关闭数据模拟，避免请求优先使用 mock 数据
				enableProd: false,
				timeout: 1000,
			}),
			// https://github.com/pd4d10/vite-plugin-svgr#options
			svgrPlugin({
				// https://react-svgr.com/docs/options/
				svgrOptions: {
					plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
					svgoConfig: {
						floatPrecision: 2,
					},
				},
			}),
			checker({
				typescript: true,
				terminal: false,
				enableBuild: false,
			}),
			/**
			 * 按需加载图标
			 * https://github.com/antfu/unplugin-icons
			 */
			Icons({
				customCollections: {
					svg: FileSystemIconLoader("./src/icons/svg"),
				},
				/**
				 * @see https://iconify.design/docs/articles/cleaning-up-icons/#parsing-one-monotone-icon
				 * Cleaning up icons
				 * Set default color to currentColor
				 * Set default width and height to 1em
				 */
				transform: (svg, collection) => {
					if (collection === "svg") {
						const svgObject = new SVG(svg);
						cleanupSVG(svgObject);
						runSVGO(svgObject);
						parseColors(svgObject, {
							defaultColor: "currentColor",
							callback: (attr, colorStr, color) => {
								if (!color) {
									// Color cannot be parsed!
									throw new Error(
										`Invalid color: "${colorStr}" in attribute ${attr}`,
									);
								}

								if (isEmptyColor(color)) {
									// Color is empty: 'none' or 'transparent'. Return as is
									return color;
								}

								// If color is not empty, return it
								return color;
							},
						});
						return svgObject.toString({ height: "1em", width: "1em" });
					}
					return svg;
				},
				compiler: "jsx",
				jsx: "react",
				scale: 1,
			}),
			// 按需启用构建分析
			...(env.ANALYZE === "true"
				? [
						visualizer({
							gzipSize: true,
							brotliSize: true,
							filename: "dist/stats.html",
						}),
					]
				: []),
		],
		resolve: {
			alias: {
				"@": resolvePath(projectRoot, "src"),
				"@components": resolvePath(projectRoot, "src/components"),
			},
		},
		test: {
			globals: true,
			environment: "happy-dom",
			setupFiles: ["./src/setupTests.ts"],
		},
		server: {
			port: 3333,
			// https://vitejs.dev/config/server-options#server-proxy
			proxy: useLocalApiProxy
				? {
						"/shanshu-efficiency-api": {
							target: "http://localhost:8080",
							changeOrigin: true,
							ws: true,
							rewrite: (path) => path.replace(/^\/shanshu-efficiency-api/, ""),
						},
					}
				: {
						"/shanshu-efficiency-api": {
							target: "http://10.0.20.98:10013",
							changeOrigin: true,
							ws: true,
							agent: new http.Agent({ keepAlive: false }),
						},
					},
			// : {
			// 	"/shanshu-efficiency-api": {
			// 		target: "http://10.0.20.189:10013",
			// 		changeOrigin: true,
			// 		ws: true,
			// 	},
			// },
			// http://10.0.20.98:10013
			// http://10.0.20.189:10013
			// https://sjmh2.lcfw.co:10013
		},
		define: {
			__APP_INFO__: JSON.stringify(__APP_INFO__),
		},
		build: {
			outDir: "dist",
			// 按需生成隐藏 Source Map
			sourcemap: env.VITE_BUILD_SOURCEMAP === "true" ? "hidden" : false,
			rollupOptions: {
				output: {
					manualChunks: {
						react: ["react", "react-dom", "react-router"],
						antd: ["antd", "@ant-design/icons"],
						faker: ["@faker-js/faker"],
					},
				},
			},
		},
	};
});
