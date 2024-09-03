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
			{authContext?.user && (
				<button onClick={authContext.onLogout}>Logout</button>
			)}
			<Outlet />
		</>
	);
}
