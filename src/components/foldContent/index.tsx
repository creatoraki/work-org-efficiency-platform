import type { CSSProperties } from "react";
import FoldHoverImg from "#src/assets/svg/fold-hover-light.svg";
import FoldImg from "#src/assets/svg/fold-light.svg";
import React, { useCallback, useState } from "react";

interface FoldContentProps {
	className?: string;
	/** 支持传入数字（像素）或字符串（例如 '16.7%'、'200px'） */
	foldWidth?: string | number;
	foldChildren: React.ReactNode;
	spreadChildren: React.ReactNode;
	/** 受控折叠态，如果传入则组件受控 */
	isFolded?: boolean;
	/** 非受控初始折叠态 */
	defaultFolded?: boolean;
	onFoldChange?: (folded: boolean) => void;
	/** 折叠按钮的 aria-label */
	ariaLabel?: string;
	/** 折叠按钮尺寸（px） */
	foldBtnSize?: number;
	style?: CSSProperties;
}

function FoldContent(props: FoldContentProps) {
	const {
		className = "",
		foldWidth = "16.7%",
		foldChildren,
		spreadChildren,
		defaultFolded = false,
		isFolded,
		onFoldChange,
		ariaLabel = "折叠/展开",
		foldBtnSize = 22,
		style = {},
	} = props;

	const [hover, setHover] = useState(false);
	const [internalFold, setInternalFold] = useState<boolean>(defaultFolded);
	const controlled = typeof isFolded === "boolean";
	const folded = controlled ? !!isFolded : internalFold;

	// defaultFolded 仅作为非受控模式下的初始值使用，避免在 prop 变更时自动重置内部状态（明确行为更安全）

	const foldWidthStr = typeof foldWidth === "number" ? `${foldWidth}px` : foldWidth;

	const handleFold = useCallback(() => {
		const next = !folded;
		if (!controlled) setInternalFold(next);
		onFoldChange?.(next);
	}, [controlled, folded, onFoldChange]);

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
		<div className={`flex h-full w-full ${className}`}>
			<div
				className="relative h-full rounded-md border bg-white/100"
				style={{
					transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
					width: folded ? 0 : foldWidthStr,
					...style,
					borderWidth: folded ? "1px " : style.borderWidth,
				}}
				aria-hidden={folded}
			>
				{!folded ? foldChildren : null}

				<button
					type="button"
					aria-label={ariaLabel}
					title={ariaLabel}
					className="fold-hover-light absolute z-10 cursor-pointer"
					style={{
						transform: folded ? "rotateY(-180deg)" : "rotateY(0deg)",
						right: `-${foldBtnSize / 2}px`,
						top: `calc(50% - ${foldBtnSize / 2}px)`,
						height: foldBtnSize,
						width: foldBtnSize,
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
						alt={ariaLabel}
						style={{
							height: foldBtnSize,
							width: foldBtnSize,
							boxShadow: "0px 0 6px rgba(0, 0, 0, 0.14)",
							borderRadius: "50%",
							display: "block",
						}}
					/>
				</button>
			</div>

			<div
				className="h-full min-w-0 flex-1"
				style={{ transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)" }}
			>
				{spreadChildren}
			</div>
		</div>
	);
}

export default React.memo(FoldContent);
