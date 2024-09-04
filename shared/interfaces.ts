export type CoordinateArray = [number, number];

export type GridCell = IGridCell | null;
export type GridPiece = IPiece | null;
export type Player = "black" | "red";
export type User = IUser | null;

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

export interface IGameSave {
	_id: string;
	name: string;
	timestamp: string;
	gameState: IGameState;
}

export interface ICanJump {
	newCoordinates: CoordinateArray;
	jumpedCell: IGridCell;
}

export interface IUser {
	_id: string;
	username: string;
	wins: number;
}

export interface ISocketUsers {
	[key: string]: ISocketGame[];
}

export interface ISocketGame {
	userId: string;
	username: string;
	socketId: string;
	position: Player;
}
