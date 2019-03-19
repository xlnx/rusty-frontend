void main() {
	vec2 tex = gl_FragCoord.xy / iResolution;
	
	vec4 a = texture2D(iChannel[0], tex);
	vec4 b = texture2D(iChannel[1], tex);
	gl_FragColor = vec4(mix(a.rgb, b.rgb, b.a), 1);
}