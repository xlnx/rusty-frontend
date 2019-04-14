import { Basemap } from "../../basemap/basemap";
import { Road } from "../road/road";
import { Component } from "../../wasp";

export class BasemapComponent extends Component<{}> {

	public readonly basemap: Basemap<Road, {}> = new Basemap()

	constructor() {
		super("basemap", {})
	}

}

new BasemapComponent().register()
