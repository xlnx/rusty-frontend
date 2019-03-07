const RoadWidth = 1

import * as THREE from "three"
import BuildingMathImpl from "./building";
import RoadMathImpl from "./road";



interface RoadLikeObject {
    readonly mathImpl: RoadMathImpl
}

interface BuildingLikeObject {
    readonly placeholder: THREE.Vector2
    readonly mathImpl: BuildingMathImpl
}

export {
    RoadWidth, RoadLikeObject, BuildingLikeObject
}