import { useReducer } from "react";
import Cell from "./components/Cell";
import {
	createGameState,
	GridCell,
	IGameState,
	IGridCell,
	isPlayableCell,
} from "./utils/gridUtils";

const checkMoreJumps = (currCell: GridCell, gameState: IGameState): boolean => {
	const origin = currCell!.coordinates;
	console.log(origin);
	for (let i = 0; i <= 1; i++) {
		const checkScenario = i % 2 === 0;
		const xValue = checkScenario ? 1 : -1;
		const yValue = currCell!.piece?.player === "black" ? 1 : -1;

		if (
			origin[0] + xValue > 7 ||
			origin[0] + xValue < 0 ||
			origin[1] + yValue > 7 ||
			origin[1] + yValue < 0
		)
			continue;
		const opp = gameState.grid[origin[0] + xValue][origin[1] + yValue];
		console.log("checking", opp?.coordinates);
		if (
			opp.coordinates[0] + xValue > 7 ||
			opp.coordinates[0] + xValue < 0 ||
			opp.coordinates[1] + yValue > 7 ||
			opp.coordinates[1] + yValue < 0
		)
			continue;
		const behind =
			gameState.grid[opp.coordinates[0] + xValue][opp.coordinates[1] + yValue];
		console.log("behind", behind.coordinates);

		if (
			currCell!.piece?.player !== opp.piece?.player &&
			behind.piece === null
		) {
			return true;
		}
	}
	return false;
};

function gridStateReducer(
	state: IGameState,
	action: {
		type: string;
		selectedCell?: GridCell;
		jumpedCell?: GridCell;
		newCell?: GridCell;
	}
) {
	const newGrid: IGridCell[][] = state.grid.map((row) =>
		row.map((cell) => {
			return {
				coordinates: [...cell.coordinates],
				piece: cell.piece ? { ...cell.piece } : null,
			};
		})
	);
	const newState = {
		grid: newGrid,
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
			console.log(selectedCell?.coordinates, selectedCell?.piece);
			newState.selectedCell = {
				coordinates: [...selectedCell!.coordinates],
				piece: { ...selectedCell!.piece! },
			};
			return newState;
		case "end_turn": {
			newState.turn = newState.turn === "black" ? "red" : "black";
			newState.continueTurn = false;
			return newState;
		}
		case "move_piece": {
			console.log(newCell?.coordinates, newCell?.piece);

			newState.grid[newCell!.coordinates[0]][newCell!.coordinates[1]].piece = {
				...state.selectedCell!.piece!,
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

			if (!newState.continueTurn) {
				newState.turn = newState.turn === "black" ? "red" : "black";
			}

			console.log(newState);
			return newState;
		}
		case "jump_piece": {
			console.log("dispatching jump_piece");
			newState.grid[jumpedCell!.coordinates[0]][jumpedCell!.coordinates[1]] = {
				coordinates: [...jumpedCell!.coordinates],
				piece: null,
			};

			const moreJumps = checkMoreJumps(newCell!, newState);
			console.log("moreJumps", moreJumps);
			newState.continueTurn = moreJumps ? true : false;
			newState.lockedSelection = moreJumps ? true : false;
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

	const selectPiece = (currCell: GridCell) => {
		console.log(currCell?.coordinates);
		if (currCell?.piece && !gameState.lockedSelection) {
			dispatchGrid({ type: "select_piece", selectedCell: currCell });
		}
	};

	const movePiece = (newCell: GridCell) => {
		if (!canMove(newCell)) return;
		console.log(newCell);
		dispatchGrid({ type: "move_piece", newCell });
	};

	const canMove = (newCell: GridCell) => {
		if (
			!newCell ||
			!isPlayableCell(newCell.coordinates[0], newCell.coordinates[1]) ||
			newCell.piece
		)
			return false;

		if (canJump(newCell)) return true;

		const origin = gameState.selectedCell!.coordinates;
		const dest = newCell.coordinates;
		console.log(origin, dest);
		if (dest[0] > origin[0] + 1 || dest[0] < origin[0] - 1) return;
		if (
			gameState.selectedCell!.piece!.player === "black" &&
			dest[1] !== origin[1] + 1
		)
			return false;
		if (
			gameState.selectedCell!.piece!.player === "red" &&
			dest[1] !== origin[1] - 1
		)
			return false;

		return true;
	};

	const canJump = (
		newCell: GridCell,
		currCell: GridCell = gameState.selectedCell
	) => {
		const origin = currCell!.coordinates;
		const dest = newCell!.coordinates;

		for (let i = 0; i <= 1; i++) {
			const checkScenario = i % 2 === 0;
			const xValue = checkScenario ? 1 : -1;
			const yValue = currCell!.piece?.player === "black" ? 1 : -1;

			if (
				origin[0] + xValue > 7 ||
				origin[0] + xValue < 0 ||
				origin[1] + yValue > 7 ||
				origin[1] + yValue < 0
			)
				continue;
			const opp = gameState.grid[origin[0] + xValue][origin[1] + yValue];
			console.log("checking", opp?.coordinates);
			if (
				opp.coordinates[0] + xValue > 7 ||
				opp.coordinates[0] + xValue < 0 ||
				opp.coordinates[1] + yValue > 7 ||
				opp.coordinates[1] + yValue < 0
			)
				continue;
			const behind =
				gameState.grid[opp.coordinates[0] + xValue][
					opp.coordinates[1] + yValue
				];

			if (
				currCell!.piece?.player !== opp.piece?.player &&
				behind.piece === null &&
				behind.coordinates[0] === dest[0] &&
				behind.coordinates[1] === dest[1]
			) {
				dispatchGrid({ type: "jump_piece", newCell, jumpedCell: opp });
				return true;
			}
		}

		return false;
	};

	const onCellClick = (cell: IGridCell) => {
		if (cell.piece && cell.piece?.player === gameState.turn) {
			selectPiece(cell);
		} else if (gameState.selectedCell !== null) {
			movePiece(cell);
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
