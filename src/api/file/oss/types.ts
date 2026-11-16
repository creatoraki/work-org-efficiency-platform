/**
 * OSS 文件下载相关类型定义
 */

// 目前 OSS 下载接口不需要特殊的类型定义
// 函数使用原始参数类型
export interface OssDownloadParams {
	bucketName: string;
	fileName: string;
}
