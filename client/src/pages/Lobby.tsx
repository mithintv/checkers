import { ISocketGame } from "@shared/interfaces";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { AuthContext } from "../context/AuthProvider";
import { SocketContext } from "../context/SocketContext";

export default function Lobby() {
	const socket = useContext(SocketContext);
	const authContext = useContext(AuthContext);
	const navigate = useNavigate();
	const { gameIdParam } = useParams();
	const [currUser] = useState(authContext?.user);
	const [gameId, setGameId] = useState(gameIdParam || uuidv4());
	const [lobby, setLobby] = useState<ISocketGame[]>([]);
	const [joinId, setJoinId] = useState("");

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
			<h2>Checkers Game Lobby</h2>
			<label>
				<input
					type="text"
					value={joinId}
					onChange={(e) => setJoinId(e.target.value)}
					className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
					placeholder=""
				/>
				<button onClick={onJoin}>Join</button>
			</label>
			{lobby.length === 0 ? (
				<p>Waiting for a second player...</p>
			) : (
				lobby.map((x) => {
					return (
						<p key={x.socketId}>
							{x.userId} {x.username}
						</p>
					);
				})
			)}
			{lobby.length === 2 && (
				<button>
					<Link to={`../../game/${gameId}/${currUser?._id}`}>Start Game</Link>
				</button>
			)}
		</div>
	);
}
