import { Component } from "../../wasp";

export class WheelMenuComponent extends Component<{}>{
    constructor() {
        super("wheel-menu", {})
    }
    init() {
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
    }
}

new WheelMenuComponent().register()