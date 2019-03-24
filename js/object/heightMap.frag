uniform sampler2D prev;
uniform vec2 wc;
uniform float w;
uniform float scale;
uniform float r;
void main()
{
	vec2 tex = gl_FragCoord.xy / iResolution;
	vec2 wp = tex * w;

	float d = length(wp - wc);

	if (d < r * 1.1) {
		
		float gaussian = exp(-d*d/8.);
		vec4 texel = texture2D(prev, tex);

		gl_FragColor = vec4(texel.x + gaussian * scale, 0, 0, 0);

	} else {
		discard;
	}
}