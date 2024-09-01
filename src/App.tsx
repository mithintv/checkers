import { useReducer } from "react";
import Cell from "./components/Cell";
import {
	checkJumps,
	createGameState,
	GridCell,
	IGameState,
	IGridCell,
	isPlayableCell,
	Player,
} from "./utils/gridUtils";

function gridStateReducer(
	state: IGameState,
	action: {
		type: string;
		selectedCell?: GridCell;
		jumpedCell?: GridCell;
		newCell?: GridCell;
	}
) {
	const newState: IGameState = {
		grid: state.grid.map((row) =>
			row.map((cell) => {
				return {
					coordinates: [...cell.coordinates],
					piece: cell.piece ? { ...cell.piece } : null,
				};
			})
		),
		turn: state.turn,
		continueTurn: state.continueTurn,
		lockedSelection: state.lockedSelection,
		selectedCell: state.selectedCell,
	};
	const { selectedCell, jumpedCell, newCell } = action;

	switch (action.type) {
		case "reset_grid":
			return createGameState();
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
				console.log(newState.selectedCell);

				const jumpList = checkJumps(
					newState.selectedCell,
					newState.grid,
					newState.turn
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

function App() {
	const [gameState, dispatchGrid] = useReducer(
		gridStateReducer,
		createGameState()
	);

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
	return (
		<>
			<div className="my-2">
				{gameState.turn[0].toUpperCase() + gameState.turn.slice(1)}'s Turn
			</div>
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
			<div className="flex flex-row justify-center gap-4">
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
				<button
					className="mt-4"
					onClick={() => dispatchGrid({ type: "reset_grid" })}
				>
					Reset
				</button>
			</div>
		</>
	);
}

export default App;
