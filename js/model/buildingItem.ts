import * as THREE from "three"
import { QuadTreeItem, UserData } from "./def";
import { AnyRect2D, minPt, maxPt } from "./geometry";
import BasemapRoadItem from "./roadItem";

export default class BasemapBuildingItem<T={}> extends UserData<T> {

    private _rect: AnyRect2D = <any>null
    private _quadTreeItem: QuadTreeItem<BasemapBuildingItem<T>> = <any>{}
    private shouldUpdate: boolean = true

    constructor(private readonly placeholder: THREE.Vector2,
        // readonly bbox2d: THREE.Box2,
        readonly angle: number,
        readonly road: BasemapRoadItem,
        readonly offset: number
    ) {
        super()

        this.checkUpdate()
    }

    set rectNeedsUpdate(flag: boolean) { this.shouldUpdate = flag }

    get rect(): AnyRect2D {
        this.checkUpdate()
        return this._rect
    }
    get quadTreeItem(): QuadTreeItem<BasemapBuildingItem<T>> {
        this.checkUpdate()
        return this._quadTreeItem
    }

    intersectRoad(road: BasemapRoadItem): boolean {
        return this.rect.intersect(road.rect)
    }

    intersectBuilding(building: BasemapBuildingItem<T>): boolean {
        return this.rect.intersect(building.rect)
    }

    private checkUpdate() {
        if (this.shouldUpdate) {
            this.shouldUpdate = false
            let houseRoadDir = this.road.to.clone().sub(this.road.from).normalize()
            let houseRoadNormDir = houseRoadDir.clone()
                .rotateAround(new THREE.Vector2(0, 0), Math.PI / 2 * this.offset! > 0 ? -1 : 1)
            let housePts = new Array<THREE.Vector2>()
            housePts[0] = this.road.from.clone()
                .add(houseRoadDir.clone().multiplyScalar(this.offset!))
                .add(houseRoadNormDir.clone().multiplyScalar(this.road.width / 2))
            housePts[1] = housePts[0].clone()
                .add(houseRoadDir.clone().multiplyScalar(this.placeholder.x))
            housePts[2] = housePts[1].clone()
                .add(houseRoadNormDir.clone().multiplyScalar(this.placeholder.y))
            housePts[3] = housePts[2].clone()
                .sub(houseRoadDir.clone().multiplyScalar(this.placeholder!.x))
            this._rect = new AnyRect2D(housePts)

            let min = minPt(housePts)
            let max = maxPt(housePts)
            Object.assign(this._quadTreeItem, {
                x: (min.x + max.x) / 2,
                y: (min.y + max.y) / 2,
                width: max.x - min.x,
                height: max.y - min.y,
                obj: this
            })
        }
    }
} 
