#pragma glslify: import('./common.glsl')

varying vec2 vUv;

uniform sampler2D prev;
uniform sampler2D mask;
uniform vec2 center;
uniform float scale;
uniform float radius;

void main() {
	vec2 point = getWorldPosition(vUv);
	float d = length(point - center);

	if (d < radius) {
		float sigma = radius / 5.;
		float gaussian = exp(-d*d/(2.*sigma*sigma));
		vec4 texel = texture2D(prev, vUv);
		vec4 tex_mask = texture2D(mask, vUv);
		if (tex_mask.y > 0.0) {
			gaussian *= (1.0 - tex_mask.x);
		}
		gl_FragColor = vec4(texel.x + gaussian * scale, 0, 0, 0);
	} else {
		discard;
	}
}