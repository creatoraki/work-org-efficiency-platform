import efficiencyAnalysisBg from "#src/assets/svg/efficiency-analysis-bg.svg";
import { BasicContent } from "#src/components";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./components/header";
import Left from "./left/index";
import Middle from "./middle/index";
import Right from "./right";
import "./index.css";

export default function EfficiencyAnalysis() {
	const [, setForceUpdateKey] = useState<number>(0);
	const [isSidebarFolded, setIsSidebarFolded] = useState<boolean>(false);
	const ref = useRef(null);
	useEffect(() => {
		const onResize = debounce(() => {
			setForceUpdateKey((prev) => prev + 1);
		}, 120);
		window.addEventListener("resize", onResize);

		// 监听容器大小变化
		const resizeObserver = new ResizeObserver((entries) => {
			// if (!chart || !ref.current) return;

			for (const entry of entries) {
				const { width, height } = entry.contentRect;

				console.warn(width, height, entry.contentRect);

				// 确保有尺寸变化
				// if (width > 0 && height > 0) {
				// 	// 强制设置容器的最小宽度，确保能正确收缩
				// 	ref.current.style.minWidth = '0';
				// 	ref.current.style.minHeight = '0';
				// 	// resize 图表
				// 	chart.resize();
				// }
			}
		});
		if (ref?.current) {
			resizeObserver.observe(ref?.current);
		}

		return () => {
			window.removeEventListener("resize", onResize);
			onResize.cancel?.();
		};
	}, []);

	const handleSidebarFoldChange = useCallback((folded: boolean) => {
		setIsSidebarFolded(folded);
	}, []);

	return (
		<BasicContent
			className="h-full w-full overflow-hidden"
			style={{
				boxSizing: "border-box",
				padding: 14,
				backgroundImage: `url(${efficiencyAnalysisBg})`,
				backgroundSize: "cover",
				backgroundPosition: "top center",
				backgroundRepeat: "no-repeat",
				paddingLeft: "0.5rem",
			}}
		>
			<div className="grid h-full w-full" style={{ gridTemplateRows: "40px 1fr" }}>
				<Header />

				<div
					ref={ref}
					className={`dashboard scrollbar h-full min-h-0 w-full pl-2 ${isSidebarFolded ? "has-folded-analysis-left" : ""}`}
				>
					<Left onFoldChange={handleSidebarFoldChange} />
					<Middle />
					<Right />
				</div>
			</div>
		</BasicContent>
	);
}
