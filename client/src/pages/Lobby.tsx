import { ISocketGame } from "@shared/interfaces";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
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
		console.log(currUser);
		navigate(`/lobby/${gameId}`);
	}, [gameId, navigate, currUser]);

	useEffect(() => {
		socket.emit("joinGame", {
			userId: currUser!._id,
			username: currUser!.username,
			gameId,
		});

		socket.on("currentUsers", (currentUsers) => {
			setLobby(currentUsers[gameId]);
		});

		socket.on("playerJoined", ({ userId }) => {
			if (userId !== currUser?._id) {
				console.log("A player joined:", userId);
			}
		});

		return () => {
			socket.off("playerJoined");
		};
	}, [currUser, gameId, socket]);

	const onJoin = () => {
		setGameId(joinId);
		navigate(`/lobby/${gameId}`);
	};

	return (
		<div>
			<h2>Checkers Game Lobby : {gameId}</h2>
			<div className="flex flex-row py-4 gap-4">
				<input
					type="text"
					value={joinId}
					onChange={(e) => setJoinId(e.target.value)}
					className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
					placeholder=""
				/>
				<button onClick={onJoin}>Join</button>
			</div>
			{lobby.length === 0 ? (
				<p>Waiting for a second player...</p>
			) : (
				lobby.map((x) => {
					return (
						<p key={x.socketId}>
							{x.username} - {x.userId} - {x.position}
						</p>
					);
				})
			)}
			<button
				className="mt-3"
				disabled={lobby.length !== 2}
				onClick={() => setPlay(true)}
			>
				Two Player Game
			</button>
			<button
				className="mt-3"
				disabled={lobby.length !== 1}
				onClick={() => setPlay(true)}
			>
				One Player Game
			</button>
			{play && (
				<Game
					lobbyParam={lobby}
					gameIdParam={gameId}
					userIdParam={currUser!._id!}
				/>
			)}
		</div>
	);
}
