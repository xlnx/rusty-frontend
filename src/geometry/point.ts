import { Component, Geometry2D } from "../../wasp";
import { RoadIndicator } from "./road";
import { DistUnit } from "../../legacy";
declare const THREE: typeof import("three")
interface PointComponentSchema {
    radius: number
    readonly color: string
}

export class PointComponent extends Component<PointComponentSchema>{

    constructor() {
        super('point-indicator', {
            radius: {
                type: "number",
                default: 1
            },
            color: {
                type: "string",
                default: "0.44 0.52 0.84"
            }
        })
    }
    init() {
        const data = this.data
        const { mesh: circle } = new Geometry2D(
            new THREE.CircleGeometry(data.radius, 32, 0, 2 * Math.PI),
            new THREE.MeshBasicMaterial({
                color: RoadIndicator.validColor,
                side: THREE.DoubleSide,
                opacity: 0.2,
                transparent: true
            }))
        const { mesh: ring } = new Geometry2D(
            new THREE.RingGeometry(data.radius, data.radius + .1, 32, 0, undefined, 2 * Math.PI),
            new THREE.MeshBasicMaterial({
                color: RoadIndicator.validColor,
                side: THREE.DoubleSide,
                opacity: 0.96,
                transparent: true
            }))
        const obj = new THREE.Object3D()
        obj.add(circle, ring)
        obj.scale.setScalar(DistUnit)
        obj.rotateY(Math.PI / 2)
        this.el.setObject3D('mesh', new THREE.Object3D().add(new THREE.Object3D().add(obj)))
        // this.el.setAttribute('position', "1 1 1")
        // this.subscribe(this.el, 'sleep', evt => {
        // 	this.el.setAttribute('visible', false)
        // })
        // this.subscribe(this.el, 'wake', evt => {
        // 	this.el.setAttribute('visible', true)
        // })
    }
}
new PointComponent().register()