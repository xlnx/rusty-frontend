import { Component } from "../../wasp";

interface WheelMenuSchema {
    outerRadius: number
}
export class WheelMenuComponent extends Component<WheelMenuSchema>{
    constructor() {
        super("wheel-menu", {
            outerRadius: {
                type: "number",
                default: 4
            }
        })
    }
    init() {
        const el = this.el
        el.setAttribute("wheel", {
            outerRadius: this.data.outerRadius,
            target: "#road_icon, #building_icon, #eye_icon, #mountain_icon, #cursor_icon"
        })
        document
            .querySelector("#road_icon_widget")
            .setAttribute("router-switch", {
                router: document.querySelector("#main-controller"),
                event: "ui-widget-click",
                value: "road"
            })
        document
            .querySelector("#building_icon_widget")
            .setAttribute("router-switch", {
                router: document.querySelector("#main-controller"),
                event: "ui-widget-click",
                value: "building"
            })
        document
            .querySelector("#eye_icon_widget")
            .setAttribute("router-switch", {
                router: document.querySelector("#main-controller"),
                event: "ui-widget-click",
                value: "preview"
            })
        document
            .querySelector("#mountain_icon_widget")
            .setAttribute("router-switch", {
                router: document.querySelector("#main-controller"),
                event: "ui-widget-click",
                value: "morph"
            })
        document
            .querySelector("#cancel_widget")
            .setAttribute("router-switch", {
                router: document.querySelector("#main-controller"),
                event: "ui-widget-click",
                value: "preview"
            })
        document
            .querySelector("#cursor_icon_widget")
            .setAttribute("router-switch", {
                router: document.querySelector("#main-controller"),
                event: "ui-widget-click",
                value: "select"
            })

    }
}

new WheelMenuComponent().register()