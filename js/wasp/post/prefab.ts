import * as accumulate from "./shaders/accumulate.frag"
import * as rgbShift from "./shaders/rgbShift.frag"
import * as copy from "./shaders/copy.frag"
import { PostStage } from "./stage";

export namespace Prefab {
	export const AccumulateShader = new PostStage({ fragmentShader: accumulate })
	export const RGBShiftShader = new PostStage({ fragmentShader: rgbShift })
	export const CopyShader = new PostStage({ fragmentShader: copy })
}