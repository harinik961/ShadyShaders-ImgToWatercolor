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
uniform float u_kernel[9];
uniform float u_kernelWeight;
uniform vec2 u_textureSize;

varying vec2 vTexCoord;

void main() {
  vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;

  vec4 colorSum =
    texture2D(uTexture, vTexCoord + onePixel * vec2(-1.0, -1.0)) * u_kernel[0] +
    texture2D(uTexture, vTexCoord + onePixel * vec2( 0.0, -1.0)) * u_kernel[1] +
    texture2D(uTexture, vTexCoord + onePixel * vec2( 1.0, -1.0)) * u_kernel[2] +
    texture2D(uTexture, vTexCoord + onePixel * vec2(-1.0,  0.0)) * u_kernel[3] +
    texture2D(uTexture, vTexCoord + onePixel * vec2( 0.0,  0.0)) * u_kernel[4] +
    texture2D(uTexture, vTexCoord + onePixel * vec2( 1.0,  0.0)) * u_kernel[5] +
    texture2D(uTexture, vTexCoord + onePixel * vec2(-1.0,  1.0)) * u_kernel[6] +
    texture2D(uTexture, vTexCoord + onePixel * vec2( 0.0,  1.0)) * u_kernel[7] +
    texture2D(uTexture, vTexCoord + onePixel * vec2( 1.0,  1.0)) * u_kernel[8];

  gl_FragColor = vec4((colorSum / u_kernelWeight).rgb, 1.0);
}
`;