import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.tsx";
import AuthProvider from "./context/AuthProvider.tsx";
import { socket, SocketContext } from "./context/SocketContext.ts";
import ThemeProvider from "./context/ThemeProvider.tsx";
import "./index.css";
import Auth from "./pages/Auth.tsx";
import Lobby from "./pages/Lobby.tsx";

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
				<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
					<RouterProvider router={router} />
				</ThemeProvider>
			</SocketContext.Provider>
		</AuthProvider>
	</StrictMode>
);
