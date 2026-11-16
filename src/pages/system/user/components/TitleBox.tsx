interface TitleBoxProps {
	title: string;
}
export default function TitleBox(props: TitleBoxProps) {
	const { title } = props;
	return (
		<div className="w-100% mb-4 flex flex-row items-center justify-start">
			<div className="mr-1 h-4 w-1 bg-[#0075FF]"></div>
			<div className="font-bold">{title}</div>
		</div>
	);
}
