import { Component, Geometry2D } from "../../wasp";
import { RoadIndicator } from "../road/road";
import { DistUnit } from "../../legacy";

declare const THREE: typeof import("three")
interface PointComponentSchema {
    radius: number
    readonly dash: boolean
}

const CircleDefaultMaterial = new THREE.MeshBasicMaterial({
    color: RoadIndicator.validColor,
    side: THREE.DoubleSide,
    opacity: 0.5,
    transparent: true
})
const RingDefaultMaterial = new THREE.MeshBasicMaterial({
    color: RoadIndicator.validColor,
    side: THREE.DoubleSide,
    opacity: 1,
    transparent: true
})
const CircleDashMaterial = new THREE.MeshBasicMaterial({
    color: RoadIndicator.validColor,
    side: THREE.DoubleSide,
    opacity: 0.2,
    transparent: true
})
const RingDashMaterial = new THREE.MeshBasicMaterial({
    color: RoadIndicator.validColor,
    side: THREE.DoubleSide,
    opacity: 0.48,
    transparent: true
})

export class PointComponent extends Component<PointComponentSchema>{

    constructor() {
        super('point', {
            radius: {
                type: "number",
                default: 1
            },
            dash: {
                type: "boolean",
                default: false
            }
        })
    }
    init() {
        const data = this.data
        const { mesh: circle } = new Geometry2D(
            new THREE.CircleGeometry(data.radius, 32, 0, 2 * Math.PI),
            data.dash ? CircleDashMaterial : CircleDefaultMaterial
        )
        const { mesh: ring } = new Geometry2D(
            new THREE.RingGeometry(data.radius, data.radius + .1, 32, 0, undefined, 2 * Math.PI),
            data.dash ? RingDashMaterial : RingDefaultMaterial
        )
        const obj = new THREE.Object3D()
        obj.add(circle, ring)
        obj.scale.setScalar(DistUnit)
        obj.rotateY(Math.PI / 2)
        this.el.setObject3D('mesh', new THREE.Object3D().add(new THREE.Object3D().add(obj)))

    }
}
new PointComponent().register()