import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.tsx";
import { socket, SocketContext } from "./context/SocketContext.ts";
import "./index.css";
import Auth from "./pages/Auth.tsx";
import Game from "./pages/Game.tsx";
import Lobby from "./pages/Lobby.tsx";
import AuthProvider from "./context/AuthProvider.tsx";

const router = createBrowserRouter([
	{
		path: "/",
		element: <App />,
		children: [
			{
				path: "auth",
				element: <Auth />,
			},
			{
				path: "lobby/:gameIdParam?",
				element: <Lobby />,
			},
		],
	},
]);

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AuthProvider>
			<SocketContext.Provider value={socket}>
				<RouterProvider router={router} />
			</SocketContext.Provider>
		</AuthProvider>
	</StrictMode>
);
