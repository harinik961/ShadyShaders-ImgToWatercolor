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
  void main() {
    gl_FragColor = texture2D(uTexture, vTexCoord);
  }
`;
//# sourceMappingURL=Shaders.js.map