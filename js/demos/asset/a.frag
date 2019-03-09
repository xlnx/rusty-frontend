uniform sampler2D film;

void main() {
	vec2 tex = gl_FragCoord.xy / iResolution;
	vec4 texel = texture2D(film, tex);
	gl_FragColor = vec4(0, 0, 1, 0.5) + texel;
}