import { useContext, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthProvider";

export default function App() {
	const navigate = useNavigate();
	const authContext = useContext(AuthContext);

	useEffect(() => {
		if (!authContext?.user) {
			navigate("/auth");
		}
	}, [authContext?.user, navigate]);

	return (
		<>
			<div className="flex flex-col h-full items-center justify-stretch">
				<h1 className="my-10 scroll-m-20 text-8xl font-extrabold tracking-tight">
					Checkers
				</h1>
				<Outlet />
			</div>
		</>
	);
}
