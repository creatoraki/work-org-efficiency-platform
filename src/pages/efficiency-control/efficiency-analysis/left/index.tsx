import Fold from "./Fold";

export interface LeftProps {
	onFoldChange?: (folded: boolean) => void;
}
export default function Left({ onFoldChange }: LeftProps) {
	return (
		<div className="analysis-left relative p-2 pr-2">
			<Fold onFoldChange={onFoldChange} />
		</div>
	);
}
