import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.tsx";
import AuthProvider from "./context/AuthProvider.tsx";
import ThemeProvider from "./context/ThemeProvider.tsx";
import "./index.css";
import Auth from "./pages/Auth.tsx";
import Lobby from "./pages/Lobby.tsx";
import SocketProvider from "./context/SocketProvider.tsx";

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
				element: (
					<SocketProvider>
						<Lobby />
					</SocketProvider>
				),
			},
		],
	},
]);

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AuthProvider>
			<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
				<RouterProvider router={router} />
			</ThemeProvider>
		</AuthProvider>
	</StrictMode>
);
