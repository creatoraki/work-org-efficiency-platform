import Fold from "./Fold";

export interface LeftProps {
	onFoldChange?: (folded: boolean) => void;
}
export default function Left({ onFoldChange }: LeftProps) {
	return (
		<div className="orgfile-left relative overflow-hidden">
			<Fold onFoldChange={onFoldChange} />
		</div>
	);
}
