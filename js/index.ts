import * as wasm from "../pkg/crate"
import GoogleDemoVR from "./demos/googleDemoVR"
import CityDemoRenderer from "./demos/city";
import CityDemoRenderer1 from "./demos/city1";
// import PlainDemoRenderer from "./demos/plain";

// let renderer = new GoogleDemoVR();
let renderer = new CityDemoRenderer1();
(<any>window)["renderer"] = renderer
renderer.start()

// import GUITest from "./demos/gui"
// new GUITest()

