import { resolveAppraisalDocumentUrl } from "#src/api/performance-management/yearly-performance";
import { Empty, Spin } from "antd";
import { useEffect, useState } from "react";
import { useAppraisalDocument } from "../hooks/use-yearly-report-queries";

/**
 * 浏览器内置 PDF 预览参数：隐藏工具栏与缩略图栏、按宽度适配
 *
 * 下载 / 全屏由抽屉工具栏统一提供，内置工具栏会与之重复。
 */
const PDF_VIEWER_PARAMS = "#toolbar=0&navpanes=0&view=FitH";

interface PdfDocumentProps {
	/** 文档地址（materialUrl / evaluationReportUrl） */
	url?: string;
	/** 文档标题（iframe 无障碍名称） */
	title: string;
	/** 无地址时的提示 */
	emptyText: string;
}

/**
 * 述职文档预览（备课材料 / 评分报告）
 *
 * 千问办公产出的述职文档统一为 A4 PDF（范例：figma/无锡地区_2026年度述职备课材料.pdf），
 * 这里用浏览器内置 PDF 预览渲染，不引入额外依赖：
 * - 先拉取为 Blob 再生成 blob: 地址，既能携带鉴权头访问后端相对路径，
 *   也能绕开存储服务返回 Content-Disposition: attachment 导致 iframe 直接下载的问题；
 * - 拉取失败（如 OSS 未开启跨域）时回退为直接加载原地址。
 *
 * @param props - 组件属性
 * @param props.url - 文档地址
 * @param props.title - 文档标题
 * @param props.emptyText - 无地址时的提示
 * @returns 文档预览
 *
 * @since 2026-11-20
 */
export function PdfDocument({ url, title, emptyText }: PdfDocumentProps) {
	const { data: blob, isError, isLoading } = useAppraisalDocument(url);
	const [objectUrl, setObjectUrl] = useState<string>();

	useEffect(() => {
		if (!blob) {
			setObjectUrl(undefined);
			return undefined;
		}
		const next = URL.createObjectURL(blob);
		setObjectUrl(next);
		return () => URL.revokeObjectURL(next);
	}, [blob]);

	if (!url) {
		return (
			<div className="flex h-full items-center justify-center rounded-md bg-white shadow-[0_0_6px_0_rgba(0,0,0,0.06)]">
				<Empty description={emptyText} />
			</div>
		);
	}

	const src = objectUrl ?? (isError ? resolveAppraisalDocumentUrl(url) : undefined);

	return (
		<div className="relative h-full overflow-hidden rounded-md bg-white shadow-[0_0_6px_0_rgba(0,0,0,0.06)]">
			{src ? (
				// Chrome / Edge 不在 sandbox iframe 中启用内置 PDF 预览（会显示「此页面已被屏蔽」），
				// 这里只加载 blob: 或后端返回的 PDF 地址，不加 sandbox
				// eslint-disable-next-line react-dom/no-missing-iframe-sandbox
				<iframe
					key={src}
					src={`${src}${PDF_VIEWER_PARAMS}`}
					title={title}
					className="block size-full border-0"
				/>
			) : null}
			{isLoading ? (
				<div className="absolute inset-0 flex items-center justify-center">
					<Spin tip="文档加载中">
						<span className="block size-16" />
					</Spin>
				</div>
			) : null}
		</div>
	);
}
