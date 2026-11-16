import FoldHoverImg from "#src/assets/svg/fold-hover-light.svg";
import FoldImg from "#src/assets/svg/fold-light.svg";
import { useCallback, useEffect, useState } from "react";
import OrgTree from "./OrgTree";

interface LeftProps {
	onFoldChange?: (folded: boolean) => void;
}

export default function Fold({ onFoldChange }: LeftProps) {
	const [isFolded, setIsFolded] = useState(false);
	const [hover, setHover] = useState(false);

	// 根据屏幕大小设置初始状态
	useEffect(() => {
		const handleResize = () => {
			// 大屏（>= 1200px）默认展开
			// 中小屏（< 1200px）默认折叠
			const shouldFold = window.innerWidth < 1250;
			setIsFolded(shouldFold);
			onFoldChange?.(shouldFold);
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [onFoldChange]);

	const handleFold = useCallback(() => {
		const next = !isFolded;
		setIsFolded(next);
		onFoldChange?.(next);
	}, [isFolded, onFoldChange]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				handleFold();
			}
		},
		[handleFold],
	);

	return (
		<div
			className="rounded-md bg-white/100"
			style={{
				transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
				borderLeft: isFolded ? "1px solid #e5e7eb" : "none",
				// borderWidth: isFolded ? "1px" : undefined,
				overflow: "hidden",
				boxShadow: "0px 0px 12px 0px #0000001F ",
			}}
		>
			{/* 内容区域 */}
			<div
				style={{
					transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
					width: isFolded ? 0 : "100%",
					height: "100%",
					overflow: "hidden",
				}}
			>
				{!isFolded && <OrgTree />}
			</div>

			{/* 折叠按钮 */}
			<button
				type="button"
				aria-label={isFolded ? "展开" : "折叠"}
				title={isFolded ? "展开" : "折叠"}
				className="fold-hover-light absolute z-10 cursor-pointer"
				style={{
					transform: isFolded ? "rotateY(-180deg)" : "rotateY(0deg)",
					right: `-${2}px`,
					top: `calc(50% - ${22 / 2}px)`,
					height: 22,
					width: 22,
					padding: 0,
					border: 0,
					background: "transparent",
				}}
				onClick={handleFold}
				onKeyDown={handleKeyDown}
				onMouseEnter={() => setHover(true)}
				onMouseLeave={() => setHover(false)}
				onFocus={() => setHover(true)}
				onBlur={() => setHover(false)}
			>
				<img
					src={hover ? FoldHoverImg : FoldImg}
					alt={isFolded ? "展开" : "折叠"}
					style={{
						height: 22,
						width: 22,
						boxShadow: "0px 0 6px rgba(0, 0, 0, 0.14)",
						borderRadius: "50%",
						display: "block",
					}}
				/>
			</button>
		</div>
	);
}
