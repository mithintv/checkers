import { User } from "@shared/interfaces";
import { createContext, useState } from "react";

type UserContext = {
	user: User,
	setUser: React.Dispatch<React.SetStateAction<User>>,
	onLogout: () => void;
}

export const AuthContext = createContext<UserContext | null>(null);

export default function AuthProvider(props: React.PropsWithChildren) {
	const [user, setUser] = useState<User>(null);

	const onLogout = async () => {
		const res = await fetch("/api/logout", {
			method: "GET"
		})
		const json = await res.json();
		console.log(json);

		setUser(null);
	}

	return (
		<AuthContext.Provider value={{ user, setUser, onLogout }}>
			{props.children}
		</AuthContext.Provider>
	);
}
