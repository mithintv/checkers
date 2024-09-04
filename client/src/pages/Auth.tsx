import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/constants";
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

		const res = await fetch(`${api}/login`, {
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

		const res = await fetch(`${api}/register`, {
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
		<form className="w-[250px] mb-auto mt-32">
			<h2 className="my-4 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
				Login
			</h2>
			<Input
				type="text"
				onChange={(e) => setUsername(e.target.value)}
				className={`my-2 ${invalid && "outline outline-rose-500"}`}
				placeholder="Username"
			/>
			<label className="flex flex-col">
				{/* <span className="text-left text-gray-200">Password</span> */}
				<Input
					type="password"
					onChange={(e) => setPassword(e.target.value)}
					className={`my-2 ${invalid && "outline outline-rose-500"}`}
					placeholder="Password"
				/>
			</label>
			<div className="flex flex-row py-6 justify-between">
				<Button onClick={onRegister}>Register</Button>
				<Button onClick={onLogin}>Login</Button>
			</div>
		</form>
	);
}
