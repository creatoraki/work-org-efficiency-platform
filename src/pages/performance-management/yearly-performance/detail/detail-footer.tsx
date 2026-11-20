import { cn } from "#src/utils";
import { Button } from "antd";
import { Download } from "lucide-react";
import { MicIcon, PowerIcon } from "../components/icons";

/** 底栏形态 */
export type DetailFooterState =
	/** 待述职 · 备课材料（设计稿 16 / 21） */
	| { type: "start"; loading?: boolean; onStart: () => void }
	/** 述职中 · 录音转写（设计稿 17）；未完成录制时主按钮为「结束录音」 */
	| {
			type: "submit";
			recorded: boolean;
			loading?: boolean;
			onPrev: () => void;
			onSubmit: () => void;
	  }
	/** 报告已生成 · 评分报告（设计稿 20） */
	| { type: "download"; loading?: boolean; onDownload: () => void };

/** 底栏按钮：32px 高、16px 字号、图标 16px */
const FOOTER_BUTTON_CLASS = "!h-8 !gap-1 !px-[15px] !text-base [&_svg]:size-4";

/**
 * 述职详情底栏
 *
 * 72px 高、上描边 #E4E7ED、左右 24px；只在需要操作的状态出现（报告生成中无底栏，设计稿 18 / 19）。
 *
 * @param props - 组件属性
 * @param props.state - 底栏形态
 * @returns 底栏
 *
 * @since 2026-11-20
 */
export function DetailFooter({ state }: { state: DetailFooterState }) {
	const renderContent = () => {
		switch (state.type) {
			case "start":
				return (
					<>
						<p className="m-0 min-w-0 flex-1 text-base leading-6 text-[#909399]">
							备课材料已从千问办公同步，评委可提前查看;点「开始述职」进入录音转写
						</p>
						<Button
							type="primary"
							className={FOOTER_BUTTON_CLASS}
							icon={<MicIcon />}
							loading={state.loading}
							onClick={state.onStart}
						>
							开始述职
						</Button>
					</>
				);
			case "submit":
				return (
					<div className="ml-auto flex items-center gap-2">
						<Button className={FOOTER_BUTTON_CLASS} onClick={state.onPrev}>
							上一步
						</Button>
						{state.recorded ? (
							<Button
								type="primary"
								className={FOOTER_BUTTON_CLASS}
								loading={state.loading}
								onClick={state.onSubmit}
							>
								提交
							</Button>
						) : (
							<Button
								danger
								className={FOOTER_BUTTON_CLASS}
								icon={<PowerIcon />}
								loading={state.loading}
								onClick={state.onSubmit}
							>
								结束录音
							</Button>
						)}
					</div>
				);
			default:
				return (
					<Button
						type="primary"
						className={cn(FOOTER_BUTTON_CLASS, "ml-auto")}
						icon={<Download strokeWidth={1.75} />}
						loading={state.loading}
						onClick={state.onDownload}
					>
						下载报告
					</Button>
				);
		}
	};

	return (
		<footer className="flex min-h-[72px] shrink-0 items-center gap-4 border-0 border-t border-solid border-[#E4E7ED] px-6 py-3">
			{renderContent()}
		</footer>
	);
}
