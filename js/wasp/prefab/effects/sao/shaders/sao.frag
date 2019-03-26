#pragma glslify: import('../../util/common.glsl')
#pragma glslify: import('../../util/packing.glsl')
#pragma glslify: import('../../util/perspective.glsl')

varying vec2 vUv;

#if DIFFUSE_TEXTURE == 1
uniform sampler2D tDiffuse;
#endif

uniform float scale;
uniform float intensity;
uniform float bias;
uniform float kernelRadius;
uniform float minResolution;
uniform vec2 size;
uniform float randomSeed;

// RGBA depth

vec4 getDefaultColor( const in vec2 screenPosition ) {
	#if DIFFUSE_TEXTURE == 1
	return texture2D( tDiffuse, vUv );
	#else
	return vec4( 1.0 );
	#endif
}

float scaleDividedByCameraFar;
float minResolutionMultipliedByCameraFar;

float getOcclusion( const in vec3 centerViewPosition, const in vec3 centerViewNormal, const in vec3 sampleViewPosition ) {
	vec3 viewDelta = sampleViewPosition - centerViewPosition;
	float viewDistance = length( viewDelta );
	float scaledScreenDistance = scaleDividedByCameraFar * viewDistance;

	return max(0.0, (dot(centerViewNormal, viewDelta) - minResolutionMultipliedByCameraFar) / scaledScreenDistance - bias) / (1.0 + pow2( scaledScreenDistance ) );
}

// moving costly divides into consts
const float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );
const float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );

float getAmbientOcclusion( const in vec3 centerViewPosition ) {
	// precompute some variables require in getOcclusion.
	scaleDividedByCameraFar = scale / cameraFar;
	minResolutionMultipliedByCameraFar = minResolution * cameraFar;
	vec3 centerViewNormal = getViewNormal( vUv );

	// jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
	float angle = rand( vUv + randomSeed ) * PI2;
	vec2 radius = vec2( kernelRadius * INV_NUM_SAMPLES ) / iResolution;
	vec2 radiusStep = radius;

	float occlusionSum = 0.0;
	float weightSum = 0.0;

	for( int i = 0; i < NUM_SAMPLES; i ++ ) {
		vec2 sampleUv = vUv + vec2( cos( angle ), sin( angle ) ) * radius;
		radius += radiusStep;
		angle += ANGLE_STEP;

		float sampleDepth = getDepth( sampleUv );
		if( sampleDepth >= ( 1.0 - EPSILON ) ) {
			continue;
		}

		float sampleViewZ = getViewZ( sampleDepth );
		vec3 sampleViewPosition = getViewPosition( sampleUv, sampleDepth, sampleViewZ );
		occlusionSum += getOcclusion( centerViewPosition, centerViewNormal, sampleViewPosition );
		weightSum += 1.0;
	}

	if( weightSum == 0.0 ) discard;

	return occlusionSum * ( intensity / weightSum );
}


void main() {
	float centerDepth = getDepth( vUv );
	if( centerDepth >= ( 1.0 - EPSILON ) ) {
		discard;
	}

	float centerViewZ = getViewZ( centerDepth );
	vec3 viewPosition = getViewPosition( vUv, centerDepth, centerViewZ );

	float ambientOcclusion = getAmbientOcclusion( viewPosition );

	gl_FragColor = getDefaultColor( vUv );
	gl_FragColor.xyz *=  1.0 - ambientOcclusion;
}

