import Leaderboard from "@/components/Leaderboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ISocketGame } from "@shared/interfaces";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import LobbyList from "../components/LobbyList";
import { AuthContext } from "../context/AuthProvider";
import { SocketContext } from "../context/SocketContext";
import Game from "./Game";

export default function Lobby() {
	const socket = useContext(SocketContext);
	const authContext = useContext(AuthContext);
	const navigate = useNavigate();
	const { gameIdParam } = useParams();
	const [currUser] = useState(authContext?.user);
	const [gameId, setGameId] = useState(gameIdParam || uuidv4());
	const [lobby, setLobby] = useState<ISocketGame[]>([]);
	const [joinId, setJoinId] = useState("");
	const [play, setPlay] = useState(false);

	useEffect(() => {
		navigate(`/lobby/${gameId}`);
	}, [gameId, navigate, currUser]);

	useEffect(() => {
		if (currUser) {
			socket.emit("joinGame", {
				userId: currUser._id,
				username: currUser.username,
				gameId,
			});

			socket.on("currentUsers", (currentUsers) => {
				setLobby(currentUsers[gameId]);
			});
		}

		return () => {
			socket.off("currentUsers");
		};
	}, [currUser, gameId, socket]);

	const onJoin = () => {
		setGameId(joinId);
		navigate(`/lobby/${gameId}`);
	};

	return (
		<div className="pt-2 pb-8 flex flex-col">
			<div className="py-4 grid grid-cols-2">
				<Button
					disabled={!play}
					className="justify-self-start"
					onClick={() => setPlay(false)}
				>
					Lobby
				</Button>

				<Button
					disabled={!authContext?.user}
					className="justify-self-end"
					onClick={authContext!.onLogout}
				>
					Logout
				</Button>
			</div>
			<p className="leading-7 [&:not(:first-child)]:mt-2">
				Game ID : {""}
				<code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
					{gameId}
				</code>
			</p>

			{!play && (
				<Tabs defaultValue="single" className="mt-8 mb-4 w-[387.9px]">
					<TabsList>
						<TabsTrigger value="single">Single Player</TabsTrigger>
						<TabsTrigger value="multi">Multi Player</TabsTrigger>
						<TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
					</TabsList>
					<TabsContent value="single">
						<div className="my-8 flex flex-col items-center">
							<Button
								className="mt-3 w-[200px]"
								disabled={lobby.length !== 1}
								onClick={() => setPlay(true)}
							>
								Start Game
							</Button>
						</div>
					</TabsContent>
					<TabsContent value="multi">
						<div className="my-8 flex flex-col items-center gap-8">
							<div className="flex flex-row py-4 gap-4">
								<Input
									className="w-[300px]"
									type="text"
									value={joinId}
									onChange={(e) => setJoinId(e.target.value)}
									placeholder="Join another game..."
								/>
								<Button onClick={onJoin}>Join</Button>
							</div>
							<LobbyList lobby={lobby} />
							<Button
								className="mt-6 w-[200px]"
								disabled={lobby.length !== 2}
								onClick={() => setPlay(true)}
							>
								Start Game
							</Button>
						</div>
					</TabsContent>
					<TabsContent value="leaderboard">
						<Leaderboard />
					</TabsContent>
				</Tabs>
			)}

			{play && (
				<Game
					lobbyParam={lobby}
					gameIdParam={gameId}
					setGameId={setGameId}
					userIdParam={currUser!._id!}
				/>
			)}
		</div>
	);
}
