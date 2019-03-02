import * as wasm from "../pkg/crate"
import GoogleDemoVR from "./demos/googleDemoVR"
import PlainDemoRenderer from "./demos/plain";

// let renderer = new GoogleDemoVR();
let renderer = new PlainDemoRenderer();
(<any>window)["renderer"] = renderer
renderer.start()

