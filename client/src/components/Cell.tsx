import { IGridCell } from "@shared/interfaces";
import { FaCrown } from "react-icons/fa";
import { isPlayableCell } from "../utils/gridUtils";

export default function Cell({
	cell,
	className,
	selected,
	onCellClick,
}: {
	cell: IGridCell;
	className: string;
	selected: boolean | null;
	onCellClick: (cell: IGridCell) => void;
}) {
	const isPlayable = isPlayableCell(cell.coordinates[0], cell.coordinates[1]);

	return (
		<div
			onClick={() => onCellClick(cell)}
			className={`flex justify-center items-center w-12 h-12 border border-[#734123] ${
				isPlayable ? "bg-[#995931]" : "bg-[#FFDE98]"
			}`}
		>
			{isPlayable && cell.piece?.player === "red" && (
				<div
					onClick={() => onCellClick(cell)}
					className={`flex justify-center items-center w-8 h-8 bg-red-500 rounded-full shadow-piece ${
						selected && "outline outline-slate-100"
					} ${className}`}
				>
					{cell.piece.king && <FaCrown />}
				</div>
			)}
			{isPlayable && cell.piece?.player === "black" && (
				<div
					onClick={() => onCellClick(cell)}
					className={`flex justify-center items-center w-8 h-8 bg-stone-700 rounded-full shadow-piece ${
						selected && "outline outline-slate-100"
					} ${className}`}
				>
					{cell.piece.king && <FaCrown />}
				</div>
			)}
		</div>
	);
}
