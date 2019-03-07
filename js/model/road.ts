import { RoadLikeObject, RoadWidth } from "./def";
import * as THREE from "three";
import { Point, Seg2D, AnyRect2D } from "./geometry";


export default class RoadMathImpl {

    private _seg: Seg2D = <any>null
    private _rect: AnyRect2D = <any>null

    private shouldUpdate: boolean = true

    get from() { return this.seg.from }
    get to() { return this.seg.to }
    set from(pt: THREE.Vector2) {
        (<any>this.seg).from = pt
        this.shouldUpdate = true
    }
    set to(pt: THREE.Vector2) {
        (<any>this.seg).to = pt
        this.shouldUpdate = true
    }

    // set shouldUpdate(flag: boolean) { this.shouldUpdate = flag }
    // buildings: { building: Building, offset: number }[]


    constructor(readonly road: RoadLikeObject, from: Point, to: Point) {
        this._seg = new Seg2D(from, to)
        this.checkUpdate()
    }

    get rect(): AnyRect2D {
        this.checkUpdate()
        return this._rect
    }

    get seg(): Seg2D {
        this.checkUpdate()
        return this._seg
    }

    private checkUpdate() {
        if (this.shouldUpdate) {
            this.shouldUpdate = false
            //update _rect
            let roadDir = this.seg.to.clone().sub(this.seg.from)
            let dir = roadDir.clone().normalize()
            let roadNormDir = dir.clone().rotateAround(new THREE.Vector2(0, 0), Math.PI / 2)
            let roadPts = new Array<THREE.Vector2>()
            roadPts[0] = this.seg.from.clone().add(roadNormDir.clone().multiplyScalar(RoadWidth))
            roadPts[1] = roadPts[0].clone().add(roadDir)
            roadPts[3] = this.seg.from.clone().add(roadNormDir.clone().multiplyScalar(-RoadWidth))
            roadPts[2] = roadPts[3].clone().add(roadDir)
            this._rect = new AnyRect2D(roadPts)
        }
    }
}