#define PI 3.14159265359
#define PI2 6.28318530718
#define PI_HALF 1.5707963267949
#define RECIPROCAL_PI 0.31830988618
#define RECIPROCAL_PI2 0.15915494
#define LOG2 1.442695
#define EPSILON 1e-6
#define saturate(a) clamp( a, 0.0, 1.0 )
#define whiteCompliment(a) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float average( const in vec3 color ) { return dot( color, vec3( 0.3333 ) ); }
// expects values in the range of [0,1]x[0,1], returns values in the [0,1] range.
// do not collapse into a single function per: http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c);
}
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
struct GeometricContext {
	vec3 position;
	vec3 normal;
	vec3 viewDir;
};
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
// http://en.wikibooks.org/wiki/GLSL_Programming/Applying_Matrix_Transformations
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
vec3 projectOnPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {
	float distance = dot( planeNormal, point - pointOnPlane );
	return - distance * planeNormal + point;
}
float sideOfPlane( in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {
	return sign( dot( point - pointOnPlane, planeNormal ) );
}
vec3 linePlaneIntersect( in vec3 pointOnLine, in vec3 lineDirection, in vec3 pointOnPlane, in vec3 planeNormal ) {
	return lineDirection * ( dot( planeNormal, pointOnPlane - pointOnLine ) / dot( planeNormal, lineDirection ) ) + pointOnLine;
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
// https://en.wikipedia.org/wiki/Relative_luminance
float linearToRelativeLuminance( const in vec3 color ) {
	vec3 weights = vec3( 0.2126, 0.7152, 0.0722 );
	return dot( weights, color.rgb );
}

varying vec2 vUv;

#if DIFFUSE_TEXTURE == 1
uniform sampler2D tDiffuse;
#endif

uniform sampler2D tDepth;
uniform sampler2D tNormal;

uniform float cameraNear;
uniform float cameraFar;
uniform mat4 cameraProjectionMatrix;
uniform mat4 cameraInverseProjectionMatrix;

uniform float scale;
uniform float intensity;
uniform float bias;
uniform float kernelRadius;
uniform float minResolution;
uniform vec2 size;
uniform float randomSeed;

// RGBA depth

#include <packing>

vec4 getDefaultColor( const in vec2 screenPosition ) {
	#if DIFFUSE_TEXTURE == 1
	return texture2D( tDiffuse, vUv );
	#else
	return vec4( 1.0 );
	#endif
}

float getDepth( const in vec2 screenPosition ) {
	return texture2D( tDepth, screenPosition ).x;
}

float getViewZ( const in float depth ) {
	return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );
}

vec3 getViewPosition( const in vec2 screenPosition, const in float depth, const in float viewZ ) {
	float clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];
	vec4 clipPosition = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );
	clipPosition *= clipW; // unprojection.

	return ( cameraInverseProjectionMatrix * clipPosition ).xyz;
}

vec3 getViewNormal( const in vec3 viewPosition, const in vec2 screenPosition ) {
	return unpackRGBToNormal( texture2D( tNormal, screenPosition ).xyz );
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
	vec3 centerViewNormal = getViewNormal( centerViewPosition, vUv );

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

