const createGridRow = (row: number) => {
	const gridRow = [];
	for (let col = 0; col < 8; col++) {
		gridRow.push([row, col]);
	}
	return gridRow;
};

export const createGridMatrix = () => {
	const gridMatrix: number[][][] = [];
	for (let i = 0; i < 8; i++) {
		const gridRow = createGridRow(i);
		gridMatrix.push(gridRow);
	}
	return gridMatrix;
};
