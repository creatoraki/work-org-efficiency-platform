import type { ECElementEvent, ECharts, EChartsOption } from "echarts";
import type { RefObject } from "react";
import * as echarts from "echarts";
import { useEffect, useState } from "react";
// import Empty from "@/components/empty";
// import usePrefersColor from "./usePrefersColor";

interface IUseInitEcharts {
	ref?: RefObject<HTMLElement>;
	options?: EChartsOption;
	listener?: any;
	onClickX?: (e: ECElementEvent) => void;
	updateDisposed?: boolean;
	memoDataZoom?: boolean;
	useEmpty?: boolean;
	renderer?: "svg" | "canvas";
}

function useInitEcharts(props: IUseInitEcharts) {
	const {
		ref,
		options,
		listener,
		onClickX,
		updateDisposed,
		memoDataZoom = true,
		useEmpty = false,
		renderer = "svg",
	} = props;

	let [chart, setChart] = useState<ECharts>();
	const [isInited, setInitedState] = useState<boolean>(false);
	const [initDataZoom, setInitDataZoom] = useState<any>({});

	// const [theme] = usePrefersColor();

	// 监听容器大小变化，自动 resize echarts
	useEffect(() => {
		if (!ref?.current) return;
		const observer = new window.ResizeObserver(() => {
			if (chart && typeof chart.resize === "function") {
				chart.resize();
			}
		});
		observer.observe(ref.current);
		return () => {
			observer.disconnect();
		};
	}, [ref?.current, chart]);

	// 监听窗口大小变化，自动 resize echarts
	useEffect(() => {
		if (!chart) return;

		const handleResize = () => {
			if (chart && typeof chart.resize === "function") {
				chart.resize();
			}
		};

		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, [chart]);

	// 初始化的时候保存第一次的datazoom值，防止被后面的值覆盖掉
	useEffect(() => {
		if (ref?.current) {
			if (!isInited) {
				setInitDataZoom(backupDataZoom(options));
				setInitedState(true);
			}
			isInited && memoDataZoom && restoreDataZoom(options, initDataZoom);
			setChart((chart = echarts.init(ref.current, undefined, { renderer })));
			onClickX && chart.on("click", onClickX);
			options && chart.setOption(options);
		}
		if (listener !== undefined && !listener) {
			chart?.dispose();
		}

		return () => {
			onClickX && chart?.off("click", onClickX);
		};
	}, [listener]);

	useEffect(() => {
		memoDataZoom && restoreDataZoom(options, backupDataZoom(chart?.getOption()));

		if (!ref?.current || !options) return;

		if (!updateDisposed) {
			chart && chart?.setOption(options);
		} else {
			chart?.dispose();
			const newChart = echarts.init(ref.current, undefined, {
				renderer: "svg",
			});
			setChart((chart = newChart));
			chart.setOption(options);
		}
	}, [JSON.stringify(options)]);

	// 空数据替换逻辑，需要在图表位置添加 Empty 组件, 在series 没有数据的时候会不显示图表内容, 需要设置 useEmpty 属性
	// todo 自动引入 empty 组件
	useEffect(() => {
		if (!useEmpty) return;
		const chartsData = (options?.series as any[])?.[0]?.data;
		if (!chartsData?.length && ref && ref.current) {
			ref.current.style.display = "none";
		} else {
			if (ref && ref.current) {
				ref.current.style.display = "block";
			}
		}
	}, [JSON.stringify(options)]);
	return chart;
}

function backupDataZoom(opt?: ReturnType<ECharts["getOption"]>) {
	if (!opt) return;

	return Array.isArray(opt.dataZoom)
		? opt.dataZoom.map(({ start, end }) => ({
				start,
				end,
			}))
		: typeof opt.dataZoom === "object" // @ts-expect-error 暂不处理
			? { start: opt.dataZoom?.start, end: opt.dataZoom?.end }
			: undefined;
}

function restoreDataZoom(opt?: EChartsOption, backup?: DataZoomBackup | DataZoomBackup[]) {
	if (!(backup && opt)) return opt;

	if (Array.isArray(opt.dataZoom)) {
		Array.isArray(backup)
			? opt.dataZoom.forEach((v, i) => Object.assign(v, backup[i] ?? {}))
			: typeof backup === "object" && opt.dataZoom.forEach((v) => Object.assign(v, backup));
	} else {
		typeof opt.dataZoom === "object" &&
			(Array.isArray(backup)
				? Object.assign(opt.dataZoom, backup[0] ?? {})
				: typeof backup === "object" && Object.assign(opt.dataZoom, backup));
	}
}

interface DataZoomBackup {
	start?: number;
	end?: number;
}

export default useInitEcharts;
