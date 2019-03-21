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

		vec4 texel = texture2D(iChannel[0], tex);

		gl_FragColor = texel;

	} else {
		discard;
	}
}