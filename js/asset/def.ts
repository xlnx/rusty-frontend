const DistUnit = 0.1

enum CityLayer {
	Origin = 0,
	Frame = 1,
	Depth = 3,
	Indicator = 5,
}

interface ObjectTag {
	type: string
}

export {
	DistUnit,
	ObjectTag,
	CityLayer
}