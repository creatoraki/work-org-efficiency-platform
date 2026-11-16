import React, { createContext, useCallback, useContext, useRef, useState } from "react";

export interface ModalEntry {
	id: string;
	name: string;
	props?: any;
	resolve: (value?: any) => void;
	reject: (err?: any) => void;
}

export interface ModalContextValue {
	open: (name: string, props?: any) => Promise<any>;
	close: (id: string, result?: any) => void;
	entries: ModalEntry[];
}

const ModalContext = createContext<ModalContextValue | null>(null);

export const ModalProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
	const idCounter = useRef(1);
	const [entries, setEntries] = useState<ModalEntry[]>([]);

	const open = useCallback((name: string, props?: any) => {
		return new Promise((resolve, reject) => {
			const id = `modal_${idCounter.current++}`;
			const entry: ModalEntry = { id, name, props, resolve, reject };
			setEntries((s) => [...s, entry]);
		});
	}, []);

	const close = useCallback((id: string, result?: any) => {
		setEntries((s) => {
			const found = s.find((e) => e.id === id);
			if (found) found.resolve(result);
			return s.filter((e) => e.id !== id);
		});
	}, []);

	return (
		<ModalContext.Provider value={{ open, close, entries }}>{children}</ModalContext.Provider>
	);
};

export function useModal() {
	const ctx = useContext(ModalContext);
	if (!ctx) throw new Error("useModal must be used within ModalProvider");
	return ctx;
}

export default ModalProvider;
