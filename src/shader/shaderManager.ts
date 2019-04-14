declare const THREE: typeof import("three")
import { ComponentWrapper, EntityBuilder } from "aframe-typescript-toolkit";
import { isFunction } from "util";

interface shaderManagerSchema {
    readonly text: string
    readonly width: number
    readonly height: number
    readonly fontSize: number
    readonly buttonDown: string
    readonly buttonUp: string
    readonly buttonClick: string
    readonly buttonSelected: string
    readonly buttonAborted: string
    readonly billboard: boolean
}

export class shaderManagerComponent extends ComponentWrapper<shaderManagerSchema> {
    private static numOfButton = 0
    private buttonId: number = shaderManagerComponent.numOfButton++
}