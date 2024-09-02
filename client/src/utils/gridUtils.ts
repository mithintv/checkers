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
	score: {
		red: number;
		black: number;
	};
	winner: Player | "tie" | null;
	turn: Player | null;
	continueTurn: boolean;
	lockedSelection: boolean;
	selectedCell: GridCell;
}

export interface IGame {
	_id: string;
}

interface ICanJump {
	newCoordinates: CoordinateArray;
	jumpedCell: IGridCell;
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
		score: {
			red: 0,
			black: 0,
		},
		winner: null,
		turn: "red",
		continueTurn: false,
		lockedSelection: false,
		selectedCell: null,
	};
};

export const isOutOfBounds = (
	curr: CoordinateArray,
	xVal: number,
	yVal: number
): boolean => {
	if (
		curr[0] + xVal > 7 ||
		curr[0] + xVal < 0 ||
		curr[1] + yVal > 7 ||
		curr[1] + yVal < 0
	)
		return true;
	return false;
};

export const checkJumps = (
	currCell: IGridCell,
	grid: IGridCell[][],
	player: Player
): ICanJump[] => {
	const origin = currCell.coordinates;
	const moreJumps: ICanJump[] = [];

	for (let i = 0; i <= 1; i++) {
		const checkScenario = i % 2 === 0;
		const xValue = checkScenario ? 1 : -1;
		const yValue = player === "black" ? 1 : -1;

		if (isOutOfBounds(origin, xValue, yValue)) continue;
		const opp = grid[origin[0] + xValue][origin[1] + yValue];
		if (isOutOfBounds(opp.coordinates, xValue, yValue)) continue;
		const behind =
			grid[opp.coordinates[0] + xValue][opp.coordinates[1] + yValue];
		console.log("checking", opp?.coordinates, "behind", behind.coordinates);
		if (!opp.piece?.player) {
			continue;
		}

		if (currCell.piece!.player !== opp.piece!.player && behind.piece === null) {
			moreJumps.push({
				newCoordinates: behind.coordinates,
				jumpedCell: opp,
			});
		}
	}
	console.log("jumpList", moreJumps);
	return moreJumps;
};

export const determineWinner = (winner: string | null) => {
	switch (winner) {
		case "tie":
			return "Tie Game!";
		case "red":
			return "Red Wins!";
		case "black":
			return "Black Wins!";
	}
};
