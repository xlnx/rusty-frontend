import * as THREE from "three"
import { BuildingLikeObject, RoadLikeObject, RoadWidth, quadTreeItem } from "./def";
import { AnyRect2D, minPt, maxPt } from "./geometry";
import RoadMathImpl from "./road";


export default class BuildingMathImpl {

    private _rect: AnyRect2D = <any>null
    private _quadTreeItem: quadTreeItem = <any>null
    private shouldUpdate: boolean = true

    set rectNeedsUpdate(flag: boolean) { this.shouldUpdate = flag }

    get rect(): AnyRect2D {
        this.checkUpdate()
        return this._rect
    }
    get quadTreeItem(): quadTreeItem {
        this.checkUpdate()
        return this._quadTreeItem
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
            this._rect = new AnyRect2D(housePts)

            let min = minPt(housePts)
            let max = maxPt(housePts)
            if (this._quadTreeItem) {
                this._quadTreeItem.x = (min.x + max.x) / 2
                this._quadTreeItem.y = (min.y + max.y) / 2
                this._quadTreeItem.width = max.x - min.x
                this._quadTreeItem.height = max.y - min.y
            }
            else {
                this._quadTreeItem = {
                    x: (min.x + max.x) / 2,
                    y: (min.y + max.y) / 2,
                    width: max.x - min.x,
                    height: max.y - min.y,
                    obj: this
                }
            }
        }
    }
}
} 
