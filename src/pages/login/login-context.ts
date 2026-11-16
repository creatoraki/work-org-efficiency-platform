import { createContext } from "react";

export interface LoginContextType {
	isLoginSuccess: boolean;
	setLoginSuccess: (success: boolean) => void;
}

export const LoginContext = createContext<LoginContextType>({
	isLoginSuccess: false,
	setLoginSuccess: () => {},
});
