export function getExportStatusBadgeStatus(
	status: number,
): "error" | "default" | "processing" | "success" {
	switch (status) {
		case -1:
			return "error";
		case 2:
			return "processing";
		case 3:
			return "success";
		case 0:
		case 1:
		default:
			return "default";
	}
}
