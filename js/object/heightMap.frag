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

	if (d < r) {
		
		float gaussian = exp(-d*d/8.);
		vec4 texel = texture2D(prev, tex);

		gl_FragColor = texel + gaussian * scale;

	} else {
		discard;
	}
}