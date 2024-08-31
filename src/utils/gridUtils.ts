type CoordinateArray = [number, number];

export type GridCell = IGridCell | null;
export type GridPiece = IPiece | null;

interface IPiece {
	player: "black" | "red";
	king: boolean;
}

export interface IGridCell {
	coordinates: CoordinateArray;
	piece: GridPiece;
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

export const createGridMatrix = () => {
	const gridMatrix: IGridCell[][] = [];
	for (let i = 0; i <= 7; i++) {
		const gridRow = createGridRow(i);
		gridMatrix.push(gridRow);
	}
	return gridMatrix;
};
