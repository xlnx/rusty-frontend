import { Component } from "../wasp";
import { mapHeight } from "../basemap/def";

interface InteractionalSchema {
    readonly up: string
    readonly down: string
    readonly click: string
    readonly enter: string
    readonly leave: string
}

class InteractionManager extends Component<{}>{
    private map = new Map<AFrame.Entity, InteractionalComponent>()
    constructor() {
        super("interaction-manager", {})
    }
    add(entity: AFrame.Entity, interaction: InteractionalComponent) {
        this.map.set(entity, interaction)
        // entity.addEventListener("pause", ()=>{
        //     this.map.delete(entity)
        // })
        // entity.addEventListener("play", ()=>{
        //     this.map.set(entity, interaction)
        // })
    }
}

export class InteractionalComponent extends Component<InteractionalSchema>{
    static manager = new InteractionManager()
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
        const manager = InteractionalComponent.manager
        data['eid'] = entity.id

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