#pragma glslify: import('./common.glsl')

varying vec2 vUv;

uniform float radius;
uniform vec2 center;
uniform vec4 axes;
uniform vec2 placeholder;

void main() {
	vec2 point = getWorldPosition(vUv);
	vec2 cd = point - center;
	vec2 xy = abs(vec2(dot(cd, axes.xy), dot(cd, axes.zw)));

	vec2 dxy = (xy - placeholder) / (radius * 0.95);

	if (dxy.x > 1.0 || dxy.y > 1.0) {
		discard;
	} else {
		vec4 texel = texture2D(iChannel[0], vUv);
		gl_FragColor = texel;
	}
}