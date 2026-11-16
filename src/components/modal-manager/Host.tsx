import { useModal } from "./context";
import registry from "./registry";

export function ModalHost() {
	const { entries, close, open } = useModal();

	return (
		<>
			{entries.map((entry) => {
				const { id, name, props } = entry;
				const Comp = registry[name];
				if (!Comp) return null;

				return (
					<Comp
						key={id}
						id={id}
						props={props}
						onClose={(res?: any) => close(id, res)}
						open={open}
					/>
				);
			})}
		</>
	);
}

export default ModalHost;
