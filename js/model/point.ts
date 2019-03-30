import { Thing, Geometry2D, Variable } from "../wasp";
import * as THREE from "three"
import { PointRadius, DistUnit } from "../asset/def";
import { Object3D, Vector2 } from "three";
import { plain2world } from "../object/trans";
import { PointDetectRadius } from "./def";


class PointIndicator extends Thing {
    private static circleColor = new THREE.Color(1, 0, 0)
    private static ringColor = new THREE.Color(1, 0, 0)
    private static circleGeo = new THREE.CircleGeometry(PointRadius, 32, 0, Math.PI * 2)
    private static ringGeo = new THREE.RingGeometry(PointRadius, PointRadius + .1, 32, 0, undefined, Math.PI * 2)

    private readonly circleMat = new THREE.MeshBasicMaterial({
        color: PointIndicator.circleColor,
        side: THREE.DoubleSide,
        opacity: 0.2,
        transparent: true
    })
    private readonly ringMat = new THREE.MeshBasicMaterial({
        color: PointIndicator.ringColor,
        side: THREE.DoubleSide,
        opacity: 0.96,
        transparent: true
    })

    private cricle = new Geometry2D(PointIndicator.circleGeo, this.circleMat)
    private ring = new Geometry2D(PointIndicator.ringGeo, this.ringMat)

    constructor(
        private readonly obj: Object3D,
        private readonly pt: Vector2,
        private readonly v: Variable
    ) {
        super()
        const Pt = plain2world(pt)
        this.cricle.scale(DistUnit, DistUnit).translate(Pt.x, Pt.z)
        this.ring.scale(DistUnit, DistUnit).translate(Pt.x, Pt.z)
        // this.cricle.translate(pt.x, pt.y)
        // this.ring.translate(pt.x, pt.y)
        obj.add(this.cricle.mesh)
        obj.add(this.ring.mesh)
    }
    checkDist() {
        const dist = (<THREE.Vector2>this.v.value).distanceTo(this.pt)
        if (dist > PointDetectRadius) {
            this.obj.remove(this.cricle.mesh)
            this.obj.remove(this.ring.mesh)
        }
    }
}

export {
    PointIndicator
}