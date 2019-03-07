import * as THREE from "three"
import { BuildingLikeObject, RoadLikeObject, RoadWidth } from "./def";
import { AnyRect2D } from "./geometry";
import RoadMathImpl from "./road";


export default class BuildingMathImpl {

    private rectangle: AnyRect2D = <any>null
    private shouldUpdate: boolean = true

    set rectNeedsUpdate(flag: boolean) { this.shouldUpdate = flag }

    get rect(): AnyRect2D {
        this.checkUpdate()
        return this.rectangle
    }

    constructor(private readonly building: BuildingLikeObject,
        // readonly bbox2d: THREE.Box2,
        readonly angle: number,
        readonly road: RoadLikeObject,
        readonly offset: number
    ) {
        this.checkUpdate()
    }

    intersectRoad(road: RoadMathImpl): boolean {
        return this.rect.intersect(road.rect)
    }

    intersectBuilding(building: BuildingMathImpl): boolean {
        return this.rect.intersect(building.rect)
    }

    private checkUpdate() {
        if (this.shouldUpdate) {
            this.shouldUpdate = false
            let houseRoadDir = this.road.mathImpl.to.clone().sub(this.road.mathImpl.from).normalize()
            let houseRoadNormDir = houseRoadDir.clone().rotateAround(new THREE.Vector2(0, 0), Math.PI / 2 * this.offset! > 0 ? -1 : 1)
            let housePts = new Array<THREE.Vector2>()
            housePts[0] = this.road.mathImpl.from.clone().add(houseRoadDir.clone().multiplyScalar(this.offset!)).add(houseRoadNormDir.clone().multiplyScalar(RoadWidth / 2))
            housePts[1] = housePts[0].clone().add(houseRoadDir.clone().multiplyScalar(this.building.placeholder.x))
            housePts[2] = housePts[1].clone().add(houseRoadNormDir.clone().multiplyScalar(this.building.placeholder.y))
            housePts[3] = housePts[2].clone().sub(houseRoadDir.clone().multiplyScalar(this.building.placeholder!.x))
            this.rectangle = new AnyRect2D(housePts)
        }
    }
} 
