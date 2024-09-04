import { api } from "@/lib/constants";
import { createContext } from "react";
import io from "socket.io-client";

const socket = io(api, { path: "/lobby" });
export const SocketContext = createContext(socket);

export default function SockerProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
	);
}
