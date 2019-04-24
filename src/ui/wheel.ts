import { EntityBuilder } from "aframe-typescript-toolkit";
import { Component } from "../wasp";
import { DoubleSide } from "three";

interface WheelComponentSchema {
    readonly innerRadius: number
    readonly outerRadius: number
    readonly target: string[]
    readonly billboard: boolean
}

// const ringColor = "#5E737C"
// const circleColor = "#0C0C16"
const ringColor = "#0C0C16"
const circleColor = "#5E737C"
const contentScale = 0.9
const edgeWidth = 0.1

export class WheelComponent extends Component<WheelComponentSchema> {

    constructor() {
        super("wheel", {
            innerRadius: {
                type: "number",
                default: 1
            },
            outerRadius: {
                type: "number",
                default: 4
            },
            target: {
                type: "array",
                default: [""]
            },
            billboard: {
                type: "boolean",
                default: true
            }
        })
    }

    init() {
        const data = this.data
        if (data.billboard) {
            this.el.setAttribute('billboard', {})
        }

        const el = this.el
        const cancelRing = EntityBuilder.create("a-entity", {
            geometry: {
                primitive: "ring",
                radiusInner: data.innerRadius - edgeWidth,
                radiusOuter: data.innerRadius
            },
            material: {
                color: ringColor
            },
            position: "0 0 .1"
        })
        const icon = EntityBuilder.create("a-image", {
            src: "#cancel_icon",
            width: Math.pow(2, 1 / 2) * data.innerRadius * contentScale,
            height: Math.pow(2, 1 / 2) * data.innerRadius * contentScale,
            alphaTest: 0.5,
            position: "0 0 .1"
        })
        const cancel = EntityBuilder.create("a-entity", {
            geometry: {
                primitive: "circle",
                radius: data.innerRadius,
            },
            material: {
                color: circleColor,
            },
            position: "0 0 0"
        }, [icon, cancelRing])
            .attachTo(el)
            .toEntity()

        const radius = (data.outerRadius + data.innerRadius) / 2
        const angle = 360 / data.target.length
        const width = data.target.length == 2 ? (data.outerRadius - data.innerRadius) / Math.pow(2, 0.5) : Math.pow(2, 0.5) * radius * Math.tan(angle / 2 / 180 * Math.PI)
        let rotateAngle = 180 * (data.target.length - 2) / data.target.length
        let contentAngle = 0
        data.target.forEach(target => {
            const parent = EntityBuilder.create("a-entity", {
            }).attachTo(el)

            const content = EntityBuilder.create("a-entity", {
                geometry: {
                    primitive: "plane",
                    width: width * contentScale,
                    height: width * contentScale
                },
                material: {
                    color: circleColor,
                },
                position: {
                    x: radius * Math.cos((rotateAngle + angle / 2) / 180 * Math.PI) * contentScale,
                    y: radius * Math.sin((rotateAngle + angle / 2) / 180 * Math.PI) * contentScale,
                    z: 0.1
                },
                // rotation: {
                //     x: 0,
                //     y: 0,
                //     z: contentAngle
                // }
            })
                .attachTo(parent)
                .toEntity()

            // if taget is text
            if (document.querySelector(target) == undefined) {
                content.setAttribute("text", {
                    value: target,
                    color: ringColor,
                    align: 'center',
                    wrapCount: target.length
                })
            }
            else {
                const icon = EntityBuilder.create("a-image", {
                    src: target,
                    width: width,
                    height: width,
                    alphaTest: 0.5,
                    position: "0 0 0.1",
                    scale: {
                        x: contentScale,
                        y: contentScale,
                        z: contentScale
                    }
                }).attachTo(content)
            }

            contentAngle += angle

            const back = EntityBuilder.create("a-entity", {
                geometry: {
                    primitive: "ring",
                    radiusInner: data.innerRadius,
                    radiusOuter: data.outerRadius,
                    thetaStart: rotateAngle,
                    thetaLength: angle
                },
                material: {
                    color: circleColor
                },
                position: "0 0 .05",
                scale: {
                    x: (radius - 2 * edgeWidth) / radius,
                    y: (radius - 2 * edgeWidth) / radius,
                    z: 0
                }
            }).attachTo(parent)
            const edge = EntityBuilder.create("a-entity", {
                geometry: {
                    primitive: "ring",
                    radiusInner: data.innerRadius,
                    radiusOuter: data.outerRadius,
                    thetaStart: rotateAngle,
                    thetaLength: angle
                },
                material: {
                    color: ringColor
                },
                position: "0 0 0"
            })
                .attachTo(parent)
                .toEntity()
            const lineLength = data.outerRadius - data.innerRadius + edgeWidth
            const line1 = EntityBuilder.create("a-entity", {
                geometry: {
                    primitive: "plane",
                    width: lineLength,
                    height: edgeWidth
                },
                material: {
                    color: ringColor
                },
                position: {
                    x: data.innerRadius + lineLength / 2 - edgeWidth,
                    y: 0,
                    z: 0.05
                },
                rotation: {
                    x: 0,
                    y: 0,
                    z: rotateAngle
                }
            }).attachTo(edge)
            // const line2 = EntityBuilder.create("a-entity", {
            //     geometry: {
            //         primitive: "plane",
            //         width: data.outerRadius - data.innerRadius,
            //         height: edgeWidth
            //     },
            //     material: {
            //         color: ringColor
            //     },
            //     position: {
            //         x: radius,
            //         y: 0,
            //         z: 0.05
            //     },
            //     rotation: {
            //         x: 0,
            //         y: 0,
            //         z: rotateAngle + angle
            //     }
            // }).attachTo(edge)

            rotateAngle += angle
        })
    }
}

new WheelComponent().register()