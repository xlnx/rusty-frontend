import * as dat from "dat.gui"

export default class GUITest {

	private readonly gui = new dat.GUI()

	private x = 10
	private msg = "asd"

	constructor() {
		for (let x of Object.keys(this)) {
			if (x != "gui") {
				this.gui.add(this, x)
			}
		}
	}

	log() {
		console.log("log()")
	}

}