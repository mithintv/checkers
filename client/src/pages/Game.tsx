import { useContext, useEffect, useReducer, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Cell from "../components/Cell";
import { SocketContext } from "../context/SocketContext";
import {
	checkJumps,
	createGameState,
	determineWinner,
	GridCell,
	IGame,
	IGameState,
	IGridCell,
	isPlayableCell,
	Player,
} from "../utils/gridUtils";

function gridStateReducer(
	state: IGameState,
	action: {
		type: string;
		selectedCell?: GridCell;
		jumpedCell?: GridCell;
		newCell?: GridCell;
		statePayload?: IGameState;
		winner?: Player;
	}
) {
	const newState: IGameState = {
		...state,
		score: {
			...state.score,
		},
		grid: state.grid.map((row) =>
			row.map((cell) => {
				return {
					coordinates: [...cell.coordinates],
					piece: cell.piece ? { ...cell.piece } : null,
				};
			})
		),
	};
	const { selectedCell, jumpedCell, newCell, statePayload, winner } = action;

	switch (action.type) {
		case "set_grid":
			if (!statePayload) {
				console.error("no state payload!");
				return state;
			}
			return statePayload;
		case "reset_grid":
			return createGameState();
		case "end_game":
			newState.selectedCell = null;
			newState.turn = null;
			newState.winner = winner!;
			return newState;
		case "select_piece":
			newState.selectedCell = {
				coordinates: [...selectedCell!.coordinates],
				piece: { ...selectedCell!.piece! },
			};
			return newState;
		case "end_turn": {
			newState.turn = newState.turn === "black" ? "red" : "black";
			newState.continueTurn = false;
			newState.lockedSelection = false;
			return newState;
		}
		case "move_piece": {
			console.log("dispatching move_piece");
			newState.grid[newCell!.coordinates[0]][newCell!.coordinates[1]].piece = {
				...state.selectedCell!.piece!,
				king:
					state.selectedCell!.piece!.king ||
					(newCell?.coordinates[1] === 0 &&
						state.selectedCell!.piece!.player === "red") ||
					(newCell?.coordinates[1] === 7 &&
						state.selectedCell!.piece!.player === "black"),
			};
			newState.grid[state.selectedCell!.coordinates[0]][
				state.selectedCell!.coordinates[1]
			] = {
				coordinates: [...state.selectedCell!.coordinates],
				piece: null,
			};
			newState.selectedCell = {
				coordinates: [...newCell!.coordinates],
				piece: { ...state.selectedCell!.piece! },
			};

			if (jumpedCell) {
				newState.grid[jumpedCell!.coordinates[0]][jumpedCell!.coordinates[1]] =
					{
						coordinates: [...jumpedCell!.coordinates],
						piece: null,
					};
				newState.score = {
					...state.score,
					[newState.turn!]: state.score[newState.turn!] + 1,
				};

				const jumpList = checkJumps(
					newState.selectedCell,
					newState.grid,
					newState.turn!
				);
				if (newState.selectedCell?.piece?.king) {
					jumpList.push(
						...checkJumps(
							newState.selectedCell,
							newState.grid,
							newState.turn === "red" ? "black" : "red"
						)
					);
				}
				newState.continueTurn = jumpList.length > 0 ? true : false;
				newState.lockedSelection = jumpList.length > 0 ? true : false;
			}

			if (!newState.continueTurn) {
				newState.turn = newState.turn === "black" ? "red" : "black";
			}

			return newState;
		}

		default:
			return state;
	}
}

export default function Game() {
	const socket = useContext(SocketContext);
	const { gameIdParam, userIdParam } = useParams();
	const navigate = useNavigate();
	const [gameId, setGameId] = useState(gameIdParam || uuidv4());
	const [gameState, dispatchGrid] = useReducer(
		gridStateReducer,
		createGameState()
	);
	const [games, setGames] = useState<IGame[]>([]);

	useEffect(() => {
		socket.emit("changeState", { userId: userIdParam, gameId, gameState });

		socket.on("stateChanged", (broadcast) => {
			console.log(broadcast.userId);
			if (broadcast.userId !== userIdParam && broadcast.gameId === gameId) {
				dispatchGrid({ type: "set_grid", statePayload: broadcast.gameState });
			}
		});

		return () => {
			socket.off("stateChanged");
		};
	}, [gameId, gameState, socket, userIdParam]);

	useEffect(() => {
		navigate(`/game/${gameId}/${userIdParam}`);
	}, [gameId, navigate, userIdParam]);

	useEffect(() => {
		if (
			!gameState.winner &&
			(gameState.score.red === 12 || gameState.score.black === 12)
		) {
			let winner;
			for (const key in gameState.score) {
				const player = key as Player;
				if (gameState.score[player] === 12) {
					winner = player;
				}
			}
			dispatchGrid({
				type: "end_game",
				winner: winner!,
			});
		}
	}, [gameState.winner, gameState.score]);

	const newGame = () => {
		const gameId = uuidv4();
		setGameId(gameId);
		dispatchGrid({ type: "reset_grid" });
	};

	const canMove = (newCell: GridCell) => {
		const origin = gameState.selectedCell!.coordinates;
		const dest = newCell!.coordinates;
		console.log("origin", origin, "dest", dest);
		if (dest[0] > origin[0] + 1 || dest[0] < origin[0] - 1) {
			console.log("x too far for piece");
			return;
		}
		if (
			gameState.selectedCell!.piece!.king &&
			(dest[1] > origin[1] + 1 || dest[1] < origin[1] - 1)
		) {
			console.log("y too far for king");
			return;
		}
		if (
			!gameState.selectedCell!.piece!.king &&
			gameState.selectedCell!.piece!.player === "black" &&
			dest[1] !== origin[1] + 1
		) {
			console.log("y too far for black");
			return;
		}
		if (
			!gameState.selectedCell!.piece!.king &&
			gameState.selectedCell!.piece!.player === "red" &&
			dest[1] !== origin[1] - 1
		) {
			console.log("y too far for red");
			return;
		}

		dispatchGrid({ type: "move_piece", newCell });
	};

	const canJump = (
		newCell: GridCell,
		currCell: GridCell = gameState.selectedCell,
		player: Player = gameState.selectedCell!.piece!.player
	) => {
		const dest = newCell!.coordinates;
		const canJumpList = checkJumps(
			currCell as IGridCell,
			gameState.grid,
			player
		);
		const jumpObj = canJumpList.find(
			(x) => x.newCoordinates[0] === dest[0] && x.newCoordinates[1] === dest[1]
		);

		if (jumpObj) {
			dispatchGrid({
				type: "move_piece",
				selectedCell: currCell,
				jumpedCell: jumpObj.jumpedCell,
				newCell,
			});
			return true;
		}

		return false;
	};

	const onCellClick = (currCell: IGridCell) => {
		console.log(currCell?.coordinates, currCell?.piece);
		if (
			currCell.piece &&
			currCell.piece.player === gameState.turn &&
			!gameState.lockedSelection
		) {
			dispatchGrid({ type: "select_piece", selectedCell: currCell });
		} else if (gameState.selectedCell !== null) {
			if (
				!currCell ||
				currCell.piece ||
				!isPlayableCell(...currCell.coordinates)
			) {
				console.log("can't move to invalid cell");
				return;
			}

			if (gameState.selectedCell!.piece!.king) {
				if (canJump(currCell, gameState.selectedCell, "red")) return;
				if (canJump(currCell, gameState.selectedCell, "black")) return;
			} else {
				if (canJump(currCell)) return;
			}

			if (!gameState.lockedSelection) {
				canMove(currCell);
			}
		}
	};

	const saveGame = async () => {
		const res = await fetch("/api/game", {
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify({
				gameId,
				gameState,
			}),
		});
		if (res.status !== 200) {
			console.error(res);
			return;
		}
		const json = await res.json();
		console.log(json);
	};

	const listGames = async () => {
		const res = await fetch(`/api/games`, {
			headers: {
				"Content-Type": "application/json",
			},
			method: "GET",
		});
		if (res.status !== 200) {
			console.error(res);
			return;
		}
		const json = await res.json();
		console.log(json);

		setGames(json);
	};

	const loadGame = async (gameId: string) => {
		const res = await fetch(`/api/game/${gameId}`, {
			headers: {
				"Content-Type": "application/json",
			},
			method: "GET",
		});
		if (res.status !== 200) {
			console.error(res);
			return;
		}
		const json = await res.json();
		console.log(json);

		setGameId(json._id);
		dispatchGrid({ type: "set_grid", statePayload: json.gameState });
	};

	const deleteGame = async (gameId: string) => {
		const res = await fetch(`/api/game/${gameId}`, {
			method: "DELETE",
		});
		if (res.status !== 200) {
			console.error(res);
			return;
		}
		const json = await res.json();
		console.log(json);
		setGames((g) => g.filter((x) => x._id !== gameId));
	};

	return (
		<>
			<div className="py-2 flex flex-row gap-4 justify-center">
				<span>Red : {gameState.score.red}</span>
				<span>Black: {gameState.score.black}</span>
			</div>

			<div className="py-2">
				<span>
					{gameState.turn
						? gameState.turn![0].toUpperCase() +
						  gameState.turn!.slice(1) +
						  "'s Turn"
						: determineWinner(gameState.winner)}
				</span>
			</div>

			<div className="py-2">
				<div className="flex flex-row border">
					{gameState.grid.map((row, rowIndex) => {
						return (
							<div className="flex flex-col" key={rowIndex}>
								{row.map((cell) => (
									<Cell
										key={`${cell.coordinates[1]}-${cell.coordinates[0]}`}
										cell={cell}
										selected={
											gameState.selectedCell?.coordinates[0] ===
												cell.coordinates[0] &&
											gameState.selectedCell?.coordinates[1] ===
												cell.coordinates[1]
										}
										onCellClick={onCellClick}
									/>
								))}
							</div>
						);
					})}
				</div>
			</div>

			<div className="w-[386px]">
				<div className="flex flex-row flex-wrap justify-center gap-4">
					<button className="mt-4" onClick={() => listGames()}>
						Load Game
					</button>
					<button className="mt-4" onClick={() => saveGame()}>
						Save Game
					</button>
					{gameState.continueTurn && (
						<button
							className="mt-4"
							onClick={() => {
								dispatchGrid({ type: "end_turn" });
							}}
						>
							End Turn
						</button>
					)}
					<button className="mt-4" onClick={newGame}>
						New Game
					</button>
				</div>

				<div className="py-2">
					{games.length > 0 &&
						games.map((g: { _id: string }) => {
							return (
								<div key={g._id} className="flex flex-row justify-center gap-3">
									<span onClick={() => loadGame(g._id)}>{g._id}</span>
									<span onClick={() => deleteGame(g._id)}>X</span>
								</div>
							);
						})}
				</div>
			</div>
		</>
	);
}
