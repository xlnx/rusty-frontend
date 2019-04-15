declare const THREE: typeof import("three")
import { EntityBuilder } from "aframe-typescript-toolkit";
import { Component } from "../wasp";

interface WheelComponentSchema {
    readonly radius: number
    readonly wakeUpEvent: string
    readonly sleepEvent: string
    readonly interactObjs: string[]
    readonly billboard: boolean
}

export class WheelComponent extends Component<WheelComponentSchema> {

    constructor() {
        super("wheel", {
            radius: {
                type: "number",
                default: 1
            },
            wakeUpEvent: {
                type: "string",
                default: ""
            },
            sleepEvent: {
                type: "string",
                default: ""
            },
            interactObjs: {
                type: "array",
                default: []
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


    }
}

new WheelComponent().register()