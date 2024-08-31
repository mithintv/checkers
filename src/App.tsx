import { useReducer, useState } from "react";
import Cell from "./components/Cell";
import {
	createGridMatrix,
	GridCell,
	IGridCell,
	isPlayableCell,
} from "./utils/gridUtils";

function gridStateReducer(
	state: IGridCell[][],
	action: { type: string; selectedCell: GridCell; newCell: GridCell }
) {
	switch (action.type) {
		case "reset_grid":
			return createGridMatrix();
		case "move_piece": {
			const { selectedCell, newCell } = action;

			const newState: IGridCell[][] = state.map((row) =>
				row.map((cell) => {
					return {
						coordinates: [...cell.coordinates],
						piece: cell.piece ? { ...cell.piece } : null,
					};
				})
			);

			newState[newCell!.coordinates[0]][newCell!.coordinates[1]].piece = {
				...selectedCell!.piece!,
			};
			newState[selectedCell!.coordinates[0]][selectedCell!.coordinates[1]] = {
				coordinates: [...selectedCell!.coordinates],
				piece: null,
			};
			return newState;
		}
		default:
			return state;
	}
}

function App() {
	const [selectedCell, setSelectedCell] = useState<GridCell>(null);
	const [gridState, dispatchGrid] = useReducer(
		gridStateReducer,
		createGridMatrix()
	);

	const selectPiece = (currCell: GridCell) => {
		console.log(currCell);
		if (currCell?.piece) {
			setSelectedCell(currCell);
		}
	};

	const movePiece = (newCell: GridCell) => {
		if (
			!newCell ||
			!isPlayableCell(newCell.coordinates[0], newCell.coordinates[1]) ||
			newCell.piece
		)
			return;

		const origin = selectedCell!.coordinates;
		const dest = newCell.coordinates;
		console.log(origin, dest);
		if (dest[0] > origin[0] + 1 || dest[0] < origin[0] - 1) return;
		if (selectedCell!.piece!.player === "black" && dest[1] !== origin[1] + 1)
			return;
		if (selectedCell!.piece!.player === "red" && dest[1] !== origin[1] - 1)
			return;

		console.log(newCell);
		dispatchGrid({ type: "move_piece", selectedCell, newCell });
		console.log(gridState);
		setSelectedCell(null);
	};

	const onCellClick = (cell: IGridCell) => {
		if (selectedCell === null || cell?.piece) {
			selectPiece(cell);
		} else {
			movePiece(cell);
		}
	};
	return (
		<>
			<div className="flex flex-row border">
				{gridState.map((row, rowIndex) => {
					return (
						<div className="flex flex-col" key={rowIndex}>
							{row.map((cell) => (
								<Cell
									key={`${cell.coordinates[1]}-${cell.coordinates[0]}`}
									cell={cell}
									selected={selectedCell?.coordinates === cell.coordinates}
									onCellClick={onCellClick}
								/>
							))}
						</div>
					);
				})}
			</div>
		</>
	);
}

export default App;
