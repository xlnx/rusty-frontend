

interface Basemap {
	// V: Point[],
	E: Map<Point, Road[]>, quadTree: any

	addRoad(from: Point, to: Point): Road
	addHouse(pt: Point, house: HousePrototype): boolean
	alignHouse(pt: Point, house: HousePrototype): { center: Point, angle: number, valid: boolean }
	// selectHouse(pt: Point): House | null
	// selectRoad(pt: Point): Road | null
	removeHouse(house: House): void;
	removeRoad(road: Road): void
}
