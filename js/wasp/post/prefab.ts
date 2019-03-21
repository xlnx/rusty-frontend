import * as THREE from "three"
import * as accumulate from "./shaders/accumulate.frag"
import * as blend from "./shaders/blend.frag"
import * as rgbShift from "./shaders/rgbShift.frag"
import * as copy from "./shaders/copy.frag"
import * as fxaa from "./shaders/fxaa.frag"
import * as gaussian from "./shaders/gaussian.frag"
import * as blue from "./shaders/blue.frag"
import * as perlin from "./shaders/perlin.frag"
import * as scale from "./shaders/scale.frag"

import { PostStage } from "./stage"

export namespace Prefab {
	export const AccumulateShader = new PostStage({ fragmentShader: accumulate })
	export const BlendShader = new PostStage({ fragmentShader: blend })
	export const RGBShiftShader = new PostStage({ fragmentShader: rgbShift })
	export const CopyShader = new PostStage({ fragmentShader: copy })
	export const FXAAShader = new PostStage({ fragmentShader: fxaa })
	export const GaussianShader = new PostStage({ fragmentShader: gaussian })
	export const BlueShader = new PostStage({ fragmentShader: blue })
	export const PerlinShader = new PostStage({ fragmentShader: perlin })
	export const ScaleShader = (x: THREE.Vector4 | number) => {
		if (typeof x == "number") x = new THREE.Vector4(x, x, x, x)
		return new PostStage({ uniforms: { scale: { value: x } }, fragmentShader: scale })
	}
}
