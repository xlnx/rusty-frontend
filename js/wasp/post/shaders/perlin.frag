#define cloud
//#define turbulence
//#define marble
//#define granite

float hash21(vec2 p)
{
	float h = dot(p,vec2(127.1,311.7));
	
	return  -1.+2.*fract(sin(h)*43758.5453123);
}

vec2 hash22(vec2 p)
{
	p = p*mat2(127.1,311.7,269.5,183.3);
	p = -1.0 + 2.0 * fract(sin(p)*43758.5453123);
	return sin(p*6.283 + iTime);
}

float perlin_noise(vec2 p)
{
	vec2 pi = floor(p);
	vec2 pf = p-pi;
	
	vec2 w = pf*pf*(3.-2.*pf);
	
	float f00 = dot(hash22(pi+vec2(.0,.0)),pf-vec2(.0,.0));
	float f01 = dot(hash22(pi+vec2(.0,1.)),pf-vec2(.0,1.));
	float f10 = dot(hash22(pi+vec2(1.0,0.)),pf-vec2(1.0,0.));
	float f11 = dot(hash22(pi+vec2(1.0,1.)),pf-vec2(1.0,1.));
	
	float xm1 = mix(f00,f10,w.x);
	float xm2 = mix(f01,f11,w.x);
	
	float ym = mix(xm1,xm2,w.y); 
	return ym;
   
}

float noise_sum(vec2 p){
	p *= 4.;
	float a = 1., r = 0., s=0.;
	
	for (int i=0; i<5; i++) {
	  r += a*perlin_noise(p); s+= a; p *= 2.; a*=.5;
	}
	
	return r/s;///(.1*3.);
}

float noise_sum_abs(vec2 p)
{	
	p *= 4.;
	float a = 1., r = 0., s=0.;
	
	for (int i=0; i<5; i++) {
	  r += a*abs(perlin_noise(p)); s+= a; p *= 2.; a*=.5;
	}
	
	return (r/s-.135)/(.06*3.);
}

float noise_sum_abs_sin(vec2 p)
{	
	p *= 7.0/4.0;
	float f = noise_sum_abs(p);
	f = sin(f * 1.5 + p.x * 4.0);
	
	return f *f;
}

float noise_one_octave(vec2 p){
	float r = 0.0;
	r += 0.125*abs(perlin_noise(p*30.));
	return r;
}

float noise(vec2 p){

	#ifdef marble
		return noise_sum_abs_sin(p);
	#elif defined turbulence
		return noise_sum_abs(p);
	#elif defined granite
		return noise_one_octave(p);
	#elif defined cloud
		return noise_sum(p);
	#endif
}

void main()
{
	vec2 uv = gl_FragCoord.xy / iResolution.xy;
	uv *= vec2(iResolution.x / iResolution.y, 1.);
	float f = noise(uv);   // * .5 + .5;

	gl_FragColor = vec4(vec3(f), 1.0);
}