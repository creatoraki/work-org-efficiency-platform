export function addThousand(num: number | string | undefined): string {
	if (num === undefined || num === null) {
		return "";
	}
	const val = Number(num);
	if (Number.isNaN(val)) {
		return num.toString();
	}
	const str = num.toString();
	const parts = str.split(".");
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return parts.join(".");
}
