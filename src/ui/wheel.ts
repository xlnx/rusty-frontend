import { EntityBuilder } from "aframe-typescript-toolkit";
import { Component } from "../wasp";
import { DoubleSide } from "three";
import * as UI from "./def";

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
const edgeWidth = 0.02

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
            id: "cancel_widget",
            geometry: {
                primitive: "circle",
                radius: data.innerRadius,
            },
            material: {
                color: circleColor,
            },
            position: "0 0 0.1",
            "ray-castable": {}
        }, [icon, cancelRing])
            .attachTo(el)
            .toEntity()
        {

            cancel.addEventListener('int-down', (evt) => {
                cancel.emit(UI.down_event)
            })
            cancel.addEventListener('int-up', (evt) => {
                cancel.emit(UI.up_event)
            })
            cancel.addEventListener('int-enter', (evt) => {
                cancel.emit(UI.enter_event)
            })
            cancel.addEventListener('int-leave', evt => {
                cancel.emit(UI.leave_event)
            })
            cancel.addEventListener('int-click', evt => {
                cancel.emit(UI.click_event)
            })
            cancel.addEventListener(UI.enter_event, () => {
                cancel.setAttribute("animation", {
                    property: "position",
                    dir: "normal",
                    dur: 250,
                    easing: "easeInSine",
                    loop: false,
                    // from: '0 0 0.1',
                    // to: '0 0 0.5'
                    from: {
                        x: 0,
                        y: 0,
                        z: 0.1
                    },
                    to: {
                        x: 0,
                        y: 0,
                        z: 0.5
                    }
                })
            })
            cancel.addEventListener(UI.down_event, () => {
                cancel.setAttribute("animation", {
                    property: "position",
                    dir: "normal",
                    dur: 250,
                    easing: "easeInSine",
                    loop: false,
                    from: '0 0 0.5',
                    to: '0 0 0.3'
                })
            })
            cancel.addEventListener(UI.up_event, () => {
                cancel.setAttribute("animation", {
                    property: "position",
                    dir: "normal",
                    dur: 250,
                    easing: "easeInSine",
                    loop: false,
                    from: '0 0 0.3',
                    to: '0 0 0.5'
                })
            })
            cancel.addEventListener(UI.leave_event, () => {
                cancel.setAttribute("animation", {
                    property: "position",
                    dir: "normal",
                    dur: 250,
                    easing: "easeInSine",
                    loop: false,
                    // from: '0 0 0.5',
                    // to: '0 0 0.1'
                    to: {
                        x: 0,
                        y: 0,
                        z: 0.1
                    },
                    from: {
                        x: 0,
                        y: 0,
                        z: 0.5
                    }
                })
            })

        }

        const radius = (data.outerRadius + data.innerRadius) / 2
        const angle = 360 / data.target.length
        const width = Math.min(Math.pow(2, 0.5) * radius * Math.tan(angle / 2 / 180 * Math.PI), (data.outerRadius - data.innerRadius) / Math.pow(2, 0.5))
        // const width = data.target.length == 2 ? (data.outerRadius - data.innerRadius) / Math.pow(2, 0.5) : Math.pow(2, 0.5) * radius * Math.tan(angle / 2 / 180 * Math.PI)
        let rotateAngle = 90 * (data.target.length - 2) / data.target.length
        let contentAngle = 0
        data.target.forEach(target => {
            const parentId = document.querySelector(target) == undefined ? `${target}_widget` : `${target.concat().slice(1)}_widget`
            const xAsix = Math.cos((contentAngle + 90) / 180 * Math.PI)
            const yAsix = Math.sin((contentAngle + 90) / 180 * Math.PI)
            const nearRadius = (radius * 1.02)
            const farRadius = (radius * 1.05)

            const parent = EntityBuilder.create("a-entity", {
                id: parentId,
                position: {
                    x: nearRadius * xAsix,
                    y: nearRadius * yAsix,
                    z: 0.1
                },
            })
                .attachTo(el)
                .toEntity()
            {
                parent.addEventListener(UI.enter_event, () => {
                    // console.log(parent.getAttribute("position"))
                    const pos: THREE.Vector3 = parent.getAttribute("position");
                    // console.log("parent", pos)
                    pos.set(farRadius * xAsix,
                        farRadius * yAsix,
                        0.1)

                    // parent.setAttribute("animation", {
                    //     // isRawProperty: true,
                    //     property: "position",
                    //     dir: "normal",
                    //     dur: 250,
                    //     easing: "easeInSine",
                    //     loop: false,
                    //     from: {
                    //         x: nearRadius * xAsix,
                    //         y: nearRadius * yAsix,
                    //         z: 0.1
                    //     },
                    //     to: {
                    //         x: nearRadius * xAsix,
                    //         y: nearRadius * yAsix,
                    //         z: 0.1
                    //     }
                    //     // to: {
                    //     //     x: farRadius * xAsix,
                    //     //     y: farRadius * yAsix,
                    //     //     z: 0.1
                    //     // }
                    //     // from: "0 0 0",
                    //     // to: "" + nearRadius * xAsix + " " + nearRadius * yAsix + " " + 0.1
                    // })
                    el.emit(`${parentId}_${UI.enter_event}`)
                })

                parent.addEventListener(UI.down_event, () => {
                    // parent.setAttribute("animation", {
                    //     property: "position",
                    //     dir: "normal",
                    //     dur: 250,
                    //     easing: "easeInSine",
                    //     loop: false,
                    //     from: '0 0 0.5',
                    //     to: '0 0 0.3'
                    // })
                    const pos: THREE.Vector3 = parent.getAttribute("position");
                    // console.log("parent", pos)
                    pos.set(nearRadius * xAsix,
                        nearRadius * yAsix,
                        0.05)

                    el.emit(`${parentId}_${UI.down_event}`)
                })
                parent.addEventListener(UI.up_event, () => {
                    // parent.setAttribute("animation", {
                    //     property: "position",
                    //     dir: "normal",
                    //     dur: 250,
                    //     easing: "easeInSine",
                    //     loop: false,
                    //     from: '0 0 0.3',
                    //     to: '0 0 0.5'
                    // })
                    const pos: THREE.Vector3 = parent.getAttribute("position");
                    // console.log("parent", pos)
                    pos.set(nearRadius * xAsix,
                        nearRadius * yAsix,
                        0.1)
                    el.emit(`${parentId}_${UI.up_event}`)

                })
                parent.addEventListener(UI.leave_event, () => {
                    const pos: THREE.Vector3 = parent.getAttribute("position");
                    // console.log("parent", pos)
                    pos.set(nearRadius * xAsix,
                        nearRadius * yAsix,
                        0.1)
                    // parent.setAttribute("animation", {
                    //     property: "position",
                    //     dir: "normal",
                    //     dur: 250,
                    //     easing: "easeInSine",
                    //     loop: false,
                    //     to: {
                    //         x: nearRadius * xAsix,
                    //         y: nearRadius * yAsix,
                    //         z: 0.1
                    //     },
                    //     from: {
                    //         x: nearRadius * xAsix,
                    //         y: nearRadius * yAsix,
                    //         z: 0.1
                    //     },
                    // })
                    el.emit(`${parentId}_${UI.leave_event}`)

                })

                parent.addEventListener(UI.click_event, () => {
                    el.emit(`${parentId}_${UI.click_event}`)
                    // console.log(`${parentId}_${UI.click_event}`)
                })
            }

            const content = EntityBuilder.create("a-entity", {
                geometry: {
                    primitive: "plane",
                    width: width * contentScale,
                    height: width * contentScale
                },
                material: {
                    color: circleColor,
                },
                position:
                {
                    x: 0,
                    y: 0,
                    z: 0.1
                }
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

            const background = EntityBuilder.create("a-entity", {
                position: "0 0 0",
                rotation: {
                    x: 0,
                    y: 0,
                    z: contentAngle
                },
            })
                .attachTo(parent)
                .toEntity()

            const back = EntityBuilder.create("a-entity", {
                geometry: {
                    primitive: "ring",
                    radiusInner: data.innerRadius,
                    radiusOuter: data.outerRadius - edgeWidth,
                    thetaStart: rotateAngle,
                    thetaLength: angle
                },
                material: {
                    color: circleColor
                },
                position: {
                    x: 0,
                    y: - radius,
                    z: 0.05
                },
                "ray-castable": {}
            }).attachTo(background)
            {
                back.toEntity().addEventListener('int-down', (evt) => {
                    parent.emit(UI.down_event, evt)
                })
                back.toEntity().addEventListener('int-up', (evt) => {
                    parent.emit(UI.up_event, evt)
                })
                back.toEntity().addEventListener('int-enter', (evt) => {
                    parent.emit(UI.enter_event, evt)
                })
                back.toEntity().addEventListener('int-leave', evt => {
                    parent.emit(UI.leave_event, evt)
                })
                back.toEntity().addEventListener('int-click', evt => {
                    parent.emit(UI.click_event, evt)
                })
            }

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
                position: {
                    x: 0,
                    y: - radius,
                    z: 0
                }
            })
                .attachTo(background)
                .toEntity()
            const lineLength = data.outerRadius - data.innerRadius
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
                    x: (radius - edgeWidth) * Math.cos((rotateAngle) / 180 * Math.PI),
                    y: (radius - edgeWidth) * Math.sin((rotateAngle) / 180 * Math.PI) - radius,
                    z: 0.07
                },
                rotation: {
                    x: 0,
                    y: 0,
                    z: rotateAngle
                }
            }).attachTo(background)
            const line2 = EntityBuilder.create("a-entity", {
                geometry: {
                    primitive: "plane",
                    width: lineLength,
                    height: edgeWidth
                },
                material: {
                    color: ringColor
                },
                position: {
                    x: (radius - edgeWidth) * Math.cos((rotateAngle + angle) / 180 * Math.PI),
                    y: (radius - edgeWidth) * Math.sin((rotateAngle + angle) / 180 * Math.PI) - radius,
                    z: 0.07
                },
                rotation: {
                    x: 0,
                    y: 0,
                    z: rotateAngle + angle
                }
            }).attachTo(background)

            contentAngle += angle
        })
    }
}

new WheelComponent().register()