import { FaCrown } from "react-icons/fa";
import { IGridCell, isPlayableCell } from "../utils/gridUtils";

export default function Cell({
	cell,
	selected,
	onCellClick,
}: {
	cell: IGridCell;
	selected: boolean | null;
	onCellClick: (cell: IGridCell) => void;
}) {
	const isPlayable = isPlayableCell(cell.coordinates[0], cell.coordinates[1]);

	return (
		<div
			onClick={() => onCellClick(cell)}
			className={`flex justify-center items-center w-12 h-12 ${
				isPlayable ? "bg-neutral-600" : "bg-neutral-200"
			}`}
		>
			{isPlayable && cell.piece?.player === "red" && (
				<div
					onClick={() => onCellClick(cell)}
					className={`flex justify-center items-center w-8 h-8 bg-red-500 rounded-full ${
						selected && "outline outline-slate-100"
					}`}
				>
					{cell.piece.king && <FaCrown />}
				</div>
			)}
			{isPlayable && cell.piece?.player === "black" && (
				<div
					onClick={() => onCellClick(cell)}
					className={`flex justify-center items-center w-8 h-8 bg-stone-800 rounded-full outline-slate-100 ${
						selected && "outline outline-slate-100"
					}`}
				>
					{cell.piece.king && <FaCrown />}
				</div>
			)}
		</div>
	);
}
