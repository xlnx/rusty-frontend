#pragma glslify: import('./common.glsl')

varying vec2 vUv;

const float sigmoid_scale = 4.0;

uniform sampler2D prev;
uniform sampler2D mask;
uniform float height;
uniform float radius;
uniform vec2 center;
uniform vec4 axes;
uniform vec2 placeholder;

float sigmoid(float x) {
	return 1.0 / (1.0 + exp(-x));
}

void main() {
	vec2 point = getWorldPosition(vUv);
	vec2 cd = point - center;
	vec2 xy = abs(vec2(dot(cd, axes.xy), dot(cd, axes.zw)));

	vec2 dxy = (xy - placeholder) / radius;

	if (dxy.x > 1.0 || dxy.y > 1.0) {
		discard;
	} else {
		vec4 texel = texture2D(prev, vUv);
		float x = 1.0;
		x *= max( sigmoid( (dxy.x - 0.5) * 2.0 * sigmoid_scale ),
			sigmoid( (dxy.y - 0.5) * 2.0 * sigmoid_scale ) );
		// gl_FragColor = vec4(1.0 - x, texel.y + 1.0, 0, 0);
		float h = height;
		// vec4 tex_mask = texture2D(mask, vUv);
		// if (dxy.x > 0.0 || dxy.y > 0.0) {
		// 	h *= (1.0 - tex_mask.x);
		// }
		gl_FragColor = vec4(x * texel.x + (1.0 - x) * h, 0, 0, 0);
	}
}