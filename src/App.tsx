import GridCell from "./components/GridCell";
import { createGridMatrix } from "./utils/gridUtils";

function App() {
	const grid = createGridMatrix();
	return (
		<>
			<div className="flex flex-row border">
				{grid.map((row, rowIndex) => {
					return (
						<div key={rowIndex}>
							{row.map((coord, colIndex) => (
								<GridCell key={`${rowIndex}-${colIndex}`} coordinates={coord} />
							))}
						</div>
					);
				})}
			</div>
		</>
	);
}

export default App;
