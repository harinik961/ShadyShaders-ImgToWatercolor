export const imgVSText = `
  attribute vec2 vertPosition;
  varying vec2 vTexCoord;
  void main() {
    vTexCoord = vec2((vertPosition.x + 1.0) / 2.0, 1.0 - (vertPosition.y + 1.0) / 2.0);    
    gl_Position = vec4(vertPosition, 0.0, 1.0);
  }
`;


export const imgFSText = `
  precision mediump float;

  uniform sampler2D uTexture; 
  varying vec2 vTexCoord;
  uniform vec2 u_dropCenter;
  uniform float u_dropRadius;

  float noise(vec2 p) {

    float n = sin(p.x) + sin(p.y);
    n += sin(p.x * 1.7 + p.y * 1.3);
    n += sin(p.x * 0.5 - p.y * 1.9); 
    
    return n * 0.125 + 0.5;
  }

  float fbm(vec2 p) {
    float val = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
        val += amp * noise(p);
        p *= 2.0;
        amp *= 0.5;
    }
    return val;
  }
     float dropInfluence(vec2 uv, vec2 center, float radius) {
  float dist = length(uv - center);
  
  float noiseScale = 3.0;
  float noiseStrength = 0.4; // start here, creep up to 0.4, 0.6, 0.8
  
  float noisyEdge = fbm(uv * noiseScale + center) * noiseStrength;
  float edge = (dist + noisyEdge) / radius;
  
  return 1.0 - smoothstep(0.6, 0.9, edge);
}

  vec4 watercolorTint(vec4 color, float N, float influence) {
    float B = 0.8 + 0.2 * N;
    float V = pow(influence, 1.5);
    vec3 edgeColor = vec3(0.05, 0.02, 0.0);
    vec3 tinted = mix(edgeColor, color.rgb * B, V);
    float blendStrength = 1.0;
    return vec4(mix(color.rgb, tinted, blendStrength * influence), color.a);
  }

   void main() {
    float N = fbm(vTexCoord * 5.0);
    vec2 distortedCoord = vTexCoord + (N - 0.5) * 0.05;
    vec4 color = texture2D(uTexture, distortedCoord);
    float B = 0.8 + 0.2 * N;
    vec3 base = color.rgb * B;

    float influence = dropInfluence(vTexCoord, u_dropCenter, u_dropRadius);
    float lum = dot(base, vec3(0.299, 0.587, 0.114));
    vec3 saturated = mix(vec3(lum), base, 1.8);
    vec3 deepened = saturated * 0.4;
float edgeness = 1.0 - influence; // 0 at center, 1 at edge
vec3 result = mix(base, deepened, edgeness * 0.8);
    gl_FragColor = vec4(result, color.a); 
  }
`;
