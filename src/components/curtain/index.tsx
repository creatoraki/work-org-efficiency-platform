import { useGlobalStore } from "#src/store";
import { AnimatePresence, motion } from "motion/react";

// Logo 和文字描边动画组件
function BrandLogoSvg() {
	const logoPath1 =
		"M17.8013 6.00012C18.2151 6.00117 18.6287 6.02303 19.0403 6.06562C17.6353 6.49681 16.344 7.23553 15.2602 8.22811C14.1764 9.2207 13.3272 10.4422 12.7745 11.804C12.2217 13.1657 11.9792 14.6335 12.0646 16.1007C12.1499 17.5679 12.561 18.9976 13.2679 20.2861C13.9749 21.5745 14.9599 22.6894 16.1515 23.5496C17.3431 24.4098 18.7114 24.9938 20.1569 25.2591C21.6024 25.5245 23.0888 25.4646 24.5083 25.0837C25.9277 24.7028 27.2445 24.0106 28.363 23.0572C27.4262 24.9386 26.0037 26.5356 24.2428 27.683C22.4818 28.8304 20.4463 29.4866 18.3468 29.5836C16.2473 29.6807 14.16 29.2151 12.3007 28.2351C10.4414 27.2551 8.87764 25.7962 7.77117 24.0092C6.6647 22.2223 6.05567 20.1722 6.00706 18.071C5.95846 15.9698 6.47204 13.8938 7.4947 12.0576C8.51736 10.2214 10.012 8.69172 11.8239 7.62677C13.6359 6.56181 15.6995 6.00024 17.8013 6.00012Z";
	const logoPath2 =
		"M19.141 10.473C19.141 10.473 18.3932 8.40974 20.0744 8.61169C22.0448 8.96102 23.6223 10.7295 23.5486 14.4329C23.5486 14.6049 23.8515 14.5994 23.846 14.4329C23.7806 10.7841 25.2707 8.97467 27.2957 8.61169C28.9959 8.44794 28.2727 10.4129 28.2863 10.4702C28.9714 9.9899 30.2704 9.92441 29.9484 11.6956C29.3753 13.8789 27.1538 14.9105 24.28 14.8068C24.1217 14.8259 24.119 15.1289 24.28 15.1371C26.9272 14.9897 29.3835 16.065 29.9511 18.2537C30.2704 20.044 28.9959 19.7575 28.1799 19.4791C28.1799 19.4791 29.307 21.3649 27.2766 21.2721C24.6238 20.9174 23.7287 17.9153 23.8433 15.5028C23.8273 15.4762 23.8047 15.4542 23.7776 15.439C23.7506 15.4237 23.7201 15.4157 23.6891 15.4157C23.6581 15.4157 23.6276 15.4237 23.6006 15.439C23.5736 15.4542 23.551 15.4762 23.5349 15.5028C23.6113 18.1582 22.7162 20.8682 20.1153 21.2721C18.0848 21.3513 19.2202 19.4791 19.2202 19.4791C18.3059 19.7684 17.1024 20.0413 17.4217 18.2646C18.1231 15.6119 20.9395 15.0852 23.1528 15.1343C23.3111 15.1343 23.3029 14.8259 23.1528 14.8123C20.0553 14.9269 17.9811 13.8271 17.4353 11.6956C17.1297 9.79887 18.4915 10.0308 19.1383 10.473H19.141Z";

	return (
		<div className="absolute left-1/2 top-[20vh] flex -translate-x-1/2 flex-row items-center gap-6">
			{/* Logo 描边动画 */}
			<svg width="140" height="140" viewBox="0 0 36 36" fill="none">
				{[logoPath1, logoPath2].map((d, i) => (
					<motion.path
						key={i}
						d={d}
						fill="#0075FF"
						stroke="#0075FF"
						strokeWidth="0.5"
						initial={{ pathLength: 0, fillOpacity: 0 }}
						animate={{
							pathLength: 1,
							fillOpacity: 1,
							transition: {
								pathLength: { duration: 1.5, ease: "easeInOut" },
								fillOpacity: { duration: 0.5, delay: 1.5 },
							},
						}}
					/>
				))}
			</svg>

			{/* 文字填充动画 */}
			<svg width="400" height="110" viewBox="0 0 400 110" className="overflow-visible">
				<defs>
					<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur stdDeviation="4" result="blur" />
						<feComposite in="SourceGraphic" in2="blur" operator="over" />
					</filter>
				</defs>
				<motion.text
					x="50%"
					y="50%"
					textAnchor="middle"
					dominantBaseline="middle"
					fontSize="64"
					fontWeight="bold"
					fill="#52c41a" // 绿色填充
					filter="url(#glow)"
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{
						opacity: 1,
						scale: 1,
						transition: { duration: 1.0, ease: "easeOut", delay: 0.5 },
					}}
					style={{
						fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
						letterSpacing: "0.2em",
					}}
				>
					绿城科技
				</motion.text>
			</svg>
		</div>
	);
}

// Loading 文字 SVG 描边动画组件
function LoadingTextSvg() {
	// 字母路径定义 (基于 0,0 到 60,100 的视口，间距 20)
	const letters = [
		// L
		{ d: "M15,15 V85 H55", x: 0 },
		// O
		{ d: "M35,15 A25,35 0 1,0 35,85 A25,35 0 1,0 35,15", x: 70 },
		// A
		{ d: "M10,85 L35,15 L60,85 M20,60 H50", x: 140 },
		// D
		{ d: "M15,15 V85 H35 A25,35 0 0,0 35,15 H15", x: 210 },
		// I
		{ d: "M35,15 V85 M15,15 H55 M15,85 H55", x: 280 },
		// N
		{ d: "M15,85 V15 L55,85 V15", x: 350 },
		// G
		{ d: "M55,35 A25,35 0 1,0 55,70 H35", x: 420 },
	];

	const totalWidth = 490; // 7 * 70
	const height = 100;

	return (
		<div className="flex h-full w-full -translate-y-40 items-center justify-center">
			<svg
				width="400"
				height="100"
				viewBox={`0 0 ${totalWidth} ${height}`}
				className="overflow-visible"
			>
				{letters.map((letter, i) => (
					<motion.path
						key={i}
						d={letter.d}
						transform={`translate(${letter.x}, 0)`}
						fill="none"
						stroke="white"
						strokeWidth="10"
						strokeLinecap="round"
						strokeLinejoin="round"
						initial={{ pathLength: 0, opacity: 0 }}
						animate={{
							pathLength: 1,
							opacity: 1,
							transition: {
								pathLength: {
									duration: 1.5,
									ease: "easeInOut",
									delay: i * 0.1 + 0.5,
								},
								opacity: { duration: 0.5, delay: i * 0.1 + 0.5 },
							},
						}}
					/>
				))}
			</svg>
		</div>
	);
}

export function Curtain() {
	const visible = useGlobalStore((state) => state.curtainVisible);

	return (
		<AnimatePresence>
			{visible && (
				<div className="pointer-events-none fixed inset-0 z-[19999]">
					{/* 主面板 (父面板) - 100vw 100vh */}
					<motion.div
						key="main-panel"
						initial={{ x: "-100%" }}
						animate={{ x: "0%" }}
						exit={{
							x: "100%",
							transition: { duration: 0.8, ease: "easeInOut", delay: 0 },
						}}
						transition={{ duration: 0.8, ease: "easeInOut" }}
						className="absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden bg-[rgba(0,0,0,0.75)]"
					>
						{/* 主面板内容：Logo + 绿城科技 */}
						<BrandLogoSvg />
					</motion.div>

					{/* 子面板 - 90vw 80vh, 吸附左侧垂直居中 */}
					<motion.div
						key="sub-panel"
						initial={{ x: "-100%" }} // 初始位置在屏幕左外侧
						animate={{ x: "0%" }} // 进场后位于 left: 0
						exit={{
							x: "100vw", // 飞出屏幕右侧。注意这里用 100vw 确保完全飞出
							transition: { duration: 0.8, ease: "easeInOut", delay: 0.5 }, // 慢 0.5s 飞出
						}}
						transition={{ duration: 0.8, ease: "easeInOut" }}
						className="absolute left-0 top-1/2 h-[80vh] w-[90vw] -translate-y-1/2 overflow-hidden rounded-r-3xl bg-[#1677ff] shadow-2xl"
					>
						{/* 子面板内容：LOADING */}
						<div className="relative flex h-full w-full items-center justify-center">
							<LoadingTextSvg />
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
