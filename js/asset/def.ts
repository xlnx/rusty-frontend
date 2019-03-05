const AssetPath = "assets/"
const DistUnit = 0.1

interface ObjectTag {
	root: boolean,
	type: string,
	object?: any,
	discard?: boolean
}

export {
	AssetPath,
	DistUnit,
	ObjectTag
}