#pragma glslify: import('./common.glsl')

varying vec2 vUv;

uniform vec2 center;
uniform float radius;

void main() { 
	vec2 point = getWorldPosition(vUv);
	float d = length(point - center);

	if (d < radius * .8) {
		vec4 texel = texture2D(iChannel[0], vUv);
		gl_FragColor = texel;
	} else {
		discard;
	}
}
