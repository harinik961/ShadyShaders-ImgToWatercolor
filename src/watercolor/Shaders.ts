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
  uniform sampler2D u_maskTex;

  varying vec2 vTexCoord;

  uniform int u_numLayers;
  uniform float u_layerBlur[8];
  uniform float u_layerOpacity[8];

  uniform float u_time;          
  uniform vec2  u_dropCenter;    

  // noise
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

  // blur
  vec4 blurSample(sampler2D tex, vec2 uv, float offset, float combined) {
    float r = offset * (1.0 + combined * 2.5);
    vec4 sum = vec4(0.0);
    sum += texture2D(tex, uv + vec2(-r, -r));
    sum += texture2D(tex, uv + vec2( r, -r));
    sum += texture2D(tex, uv + vec2(-r,  r));
    sum += texture2D(tex, uv + vec2( r,  r));
    sum += texture2D(tex, uv);
    return sum / 5.0;
}

  // main
  void main() {
    vec4 origColor = texture2D(uTexture, vTexCoord);
    float maskInfluence = texture2D(u_maskTex, vTexCoord).a;

    float t = clamp(u_time / 1.5, 0.0, 1.0);
    float spreadRadius = t * 0.08;                 
    float dist = distance(vTexCoord, u_dropCenter);
    float spread = smoothstep(spreadRadius, spreadRadius - 0.15, dist);
    float fade = 1.0 - smoothstep(0.0, 1.0, t);
    float edge = smoothstep(spreadRadius - 0.05, spreadRadius, dist);
    float spreadInfluence = spread * fade * (0.7 + 0.3 * edge);
    float accumulatedMask = maskInfluence * maskInfluence;
    float combined = max(accumulatedMask, spreadInfluence);
    if (combined <= 0.0) {
        gl_FragColor = origColor;
        return;
    }

    float N = fbm(vTexCoord * 5.0);

    vec2 distortedCoord = vTexCoord + (N - 0.5) * 0.08 * combined;
    distortedCoord = clamp(distortedCoord, 0.0, 1.0);
    vec2 dir = normalize(vTexCoord - u_dropCenter);
    distortedCoord += dir * 0.03 * spreadInfluence; 
    vec4 color = texture2D(uTexture, distortedCoord);

    float B = 0.75 + 0.35 * N;
    vec3 base = color.rgb * B;

    float lum = dot(base, vec3(0.299, 0.587, 0.114));
    vec3 saturated = mix(vec3(lum), base, 2.0);

    float ringInner = 0.2 + accumulatedMask * 0.3;
    float edgeness  = 1.0 - smoothstep(ringInner, 1.0, combined);
    float ringStrength = mix(0.35, 0.15, accumulatedMask);
    vec3 deepened = saturated * mix(1.0, ringStrength, edgeness);

    vec3 result = deepened;

    vec3 layered = result;
    for (int i = 0; i < 8; i++) {
        if (i >= u_numLayers) break;
        float low  = float(i)     / float(u_numLayers);
        float high = float(i + 1) / float(u_numLayers);
        vec4 blurred = blurSample(uTexture, distortedCoord, u_layerBlur[i], combined);
        float layerLum = (blurred.r + blurred.g + blurred.b) / 3.0;
        float inBand = smoothstep(low - 0.05, low + 0.05, layerLum)
                     - smoothstep(high - 0.05, high + 0.05, layerLum);
        float alpha = inBand * u_layerOpacity[i];
        layered = mix(layered, blurred.rgb, alpha);
    }

    float blendStrength = smoothstep(0.0, 0.5, combined);
    vec3 finalColor = mix(origColor.rgb, layered, blendStrength * 0.9);
    gl_FragColor = vec4(finalColor, color.a);
}
`;