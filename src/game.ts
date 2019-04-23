import { BuildingManagerComponent } from "./entity";
import { Component } from "./wasp";

export class TestButtonComponent extends Component<{}> {

	constructor() {
		super("test-button")
	}

	init() {
		this.listen("button-click", () => console.log("click"))
		this.listen("button-up", () => console.log("up"))
		this.listen("button-down", () => console.log("down"))
	}
}

new TestButtonComponent().register()

export class GameComponent extends Component<{}> {
	constructor() { super("game", {}) }

	init() {
	}
}

new GameComponent().register()
