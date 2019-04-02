import { AttachRadius, roadHeight } from "../model/def";

const DistUnit = 0.1
const PointRadius = AttachRadius * DistUnit
const pointHeight = roadHeight + 0.05

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
	CityLayer,
	PointRadius
}