export default function GridCell({ coordinates }: { coordinates: number[] }) {
	const isDark =
		(coordinates[0] % 2 == 0 && coordinates[1] % 2 === 0) ||
		(coordinates[0] % 2 !== 0 && coordinates[1] % 2 !== 0);
	return (
		<div
			className={`w-12 h-12 ${isDark ? "bg-neutral-600" : "bg-neutral-200"}`}
		></div>
	);
}
