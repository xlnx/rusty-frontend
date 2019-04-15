import { Component } from "../wasp";

interface InteractionalSchema {
    readonly up: string
    readonly down: string
    readonly click: string
    readonly enter: string
    readonly leave: string
}

export class InteractionalComponent extends Component<InteractionalSchema>{
    static interactionalNumber = 0
    readonly ID = InteractionalComponent.interactionalNumber++
    constructor() {
        super("interactional", {
            up: {
                type: "string",
                default: ""
            },
            down: {
                type: "string",
                default: ""
            },
            click: {
                type: "string",
                default: ""
            },
            enter: {
                type: "string",
                default: ""
            },
            leave: {
                type: "string",
                default: ""
            },
        })
    }

    init() {
        const data = this.data
        const entity = this.el

        this.subscribe(entity, "int-up", (evt) => {
            entity.emit(data.up, evt)
        })
        this.subscribe(entity, "int-down", (evt) => {
            entity.emit(data.down, evt)
        })
        this.subscribe(entity, "int-click", (evt) => {
            entity.emit(data.click, evt)
        })
        this.subscribe(entity, "int-enter", (evt) => {
            entity.emit(data.enter, evt)
        })
        this.subscribe(entity, "int-leave", (evt) => {
            entity.emit(data.leave, evt)
        })
    }
}
new InteractionalComponent().register()