interface HousePrototype {
	w: number,
	h: number,
	model: any
}

interface House {
	proto: HousePrototype
}

interface PlainCoord {
	x: number,
	y: number
}

interface Point {
	coord: PlainCoord
}

interface Road {
	readonly from: Point,	// grid
	readonly to: Point,
	houses: {
		house: House,
		offset: number
	}[],
	// model: any
}

interface Basemap {
	// V: Point[],
	E: Map<Point, Road[]>,
	quadTree: any

	addRoad(from: Point, to: Point): Road
	addHouse(pt: Point, house: HousePrototype): boolean
	alignHouse(pt: Point, house: HousePrototype): {
		center: Point,
		angle: number,
		valid: boolean
	}
	// selectHouse(pt: Point): House | null
	// selectRoad(pt: Point): Road | null
	removeHouse(house: House): void
	removeRoad(road: Road): void
}
