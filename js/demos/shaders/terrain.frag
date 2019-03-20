void main()
{
	vec2 tex = gl_FragCoord.xy / iResolution;

	vec4 texel = texture2D(iChannel[0], tex);
	const float th = .1;
	texel = (max(texel, vec4(th)) - th) * (1. - th);

	gl_FragColor = texel * 2.;
}