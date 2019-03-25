import * as THREE from "three"

import { Shader } from "../post/stage"

export const AccumulateShader: Shader = {
	fragmentShader: require("./shaders/accumulate.frag")
}
export const BlendShader: Shader = {
	fragmentShader: require("./shaders/blend.frag")
}
export const RGBShiftShader: Shader = {
	fragmentShader: require("./shaders/rgbShift.frag")
}
export const CopyShader: Shader = {
	fragmentShader: require("./shaders/copy.frag")
}
export const FXAAShader: Shader = {
	fragmentShader: require("./shaders/fxaa.frag")
}
export const GaussianShader: Shader = {
	fragmentShader: require("./shaders/gaussian.frag")
}
export const BlueShader: Shader = {
	fragmentShader: require("./shaders/blue.frag")
}
export const PerlinShader: Shader = {
	fragmentShader: require("./shaders/perlin.frag")
}
export const ScaleShader: Shader = {
	uniforms: {
		'scale': { type: 'v3', value: new THREE.Vector3(1, 1, 1) }
	},
	fragmentShader: require("./shaders/scale.frag")
}
