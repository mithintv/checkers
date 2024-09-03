import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";

export default function Auth() {
	const authContext = useContext(AuthContext);
	const navigate = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [invalid, setInvalid] = useState(false);
	const onLogin = async (e: React.FormEvent) => {
		setInvalid(false);
		e.preventDefault();
		console.log(username, password);

		const res = await fetch("/api/login", {
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify({
				username,
				password,
			}),
		});
		if (res.status === 200) {
			const user = await res.json();
			console.log(user);
			authContext?.setUser(user);
			navigate("/lobby");
			return;
		}

		setInvalid(true);
	};

	const onRegister = async (e: React.FormEvent) => {
		setInvalid(false);
		e.preventDefault();
		console.log(username, password);

		const res = await fetch("/api/register", {
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify({
				username,
				password,
			}),
		});
		if (res.status !== 200) {
			setInvalid(true);
			return;
		}

		onLogin(e);
	};

	return (
		<form className="w-[250px]">
			<label className="flex flex-col py-4">
				<span className="text-left text-gray-200">Username</span>
				<input
					type="text"
					onChange={(e) => setUsername(e.target.value)}
					className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
						invalid && "outline outline-rose-500"
					}`}
					placeholder=""
				/>
			</label>
			<label className="flex flex-col">
				<span className="text-left text-gray-200">Password</span>
				<input
					type="password"
					onChange={(e) => setPassword(e.target.value)}
					className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
						invalid && "outline outline-rose-500"
					}`}
					placeholder=""
				/>
			</label>
			<div className="flex flex-row py-6 justify-between">
				<button onClick={onRegister}>Register</button>
				<button onClick={onLogin}>Login</button>
			</div>
		</form>
	);
}
