#pragma glslify: fxaa = require(glsl-fxaa)

void main() {
	gl_FragColor = fxaa(iChannel[0], gl_FragCoord.xy, iResolution);
}