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

  void main() {
    float N = fbm(vTexCoord * 5.0);
    vec2 distortedCoord = vTexCoord + (N - 0.5) * 0.05;
    vec4 color = texture2D(uTexture, distortedCoord);

    float B = 0.8 + 0.2 * N;
    gl_FragColor = vec4(color.rgb * B, color.a); 
  }
`;
// export const imgFSText = `
// precision mediump float;
// uniform sampler2D uTexture;
// varying vec2 vTexCoord;
// void main() {
//   vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
//   vec4 colorSum =
//     texture2D(uTexture, vTexCoord + onePixel * vec2(-1.0, -1.0)) * u_kernel[0] +
//     texture2D(uTexture, vTexCoord + onePixel * vec2( 0.0, -1.0)) * u_kernel[1] +
//     texture2D(uTexture, vTexCoord + onePixel * vec2( 1.0, -1.0)) * u_kernel[2] +
//     texture2D(uTexture, vTexCoord + onePixel * vec2(-1.0,  0.0)) * u_kernel[3] +
//     texture2D(uTexture, vTexCoord + onePixel * vec2( 0.0,  0.0)) * u_kernel[4] +
//     texture2D(uTexture, vTexCoord + onePixel * vec2( 1.0,  0.0)) * u_kernel[5] +
//     texture2D(uTexture, vTexCoord + onePixel * vec2(-1.0,  1.0)) * u_kernel[6] +
//     texture2D(uTexture, vTexCoord + onePixel * vec2( 0.0,  1.0)) * u_kernel[7] +
//     texture2D(uTexture, vTexCoord + onePixel * vec2( 1.0,  1.0)) * u_kernel[8];
//   gl_FragColor = vec4((colorSum / u_kernelWeight).rgb, 1.0);
// }
// `;
//# sourceMappingURL=Shaders.js.map