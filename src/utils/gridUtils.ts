export type CoordinateArray = [number, number];

export type GridCell = IGridCell | null;
export type GridPiece = IPiece | null;
export type Player = "black" | "red";

export interface IPiece {
	player: Player;
	king: boolean;
}

export interface IGridCell {
	coordinates: CoordinateArray;
	piece: GridPiece;
}

export interface IGameState {
	grid: IGridCell[][];
	turn: Player;
	continueTurn: boolean;
	lockedSelection: boolean;
	selectedCell: GridCell;
}

export const isPlayableCell = (row: number, col: number) => {
	return (row % 2 == 0 && col % 2 === 0) || (row % 2 !== 0 && col % 2 !== 0);
};

const createGridRow = (row: number) => {
	const gridRow = [];
	for (let col = 0; col <= 7; col++) {
		const isPlayable = isPlayableCell(row, col);
		let piece: GridPiece = null;
		if (isPlayable && col >= 0 && col <= 2) {
			piece = {
				player: "black",
				king: false,
			};
		} else if (isPlayable && col >= 5) {
			piece = {
				player: "red",
				king: false,
			};
		}

		const gridCell: IGridCell = {
			coordinates: [row, col],
			piece,
		};
		gridRow.push(gridCell);
	}
	return gridRow;
};

export const createGameState = (): IGameState => {
	const gridMatrix: IGridCell[][] = [];
	for (let i = 0; i <= 7; i++) {
		const gridRow = createGridRow(i);
		gridMatrix.push(gridRow);
	}
	return {
		grid: gridMatrix,
		turn: "red",
		continueTurn: false,
		lockedSelection: false,
		selectedCell: null,
	};
};
