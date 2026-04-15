import { Debugger } from "../lib/webglutils/Debugging.js";
import {
  CanvasAnimation,
  WebGLUtilities
} from "../lib/webglutils/CanvasAnimation.js";
import { GUI} from "./Gui.js";
import {
  imgVSText,
  imgFSText
} from "./Shaders.js";
import { Mat4, Vec4, Vec3 } from "../lib/TSM.js";
import { RenderPass } from "../lib/webglutils/RenderPass.js";
import { Camera } from "../lib/webglutils/Camera.js";

export class WatercolorAnimation extends CanvasAnimation {

  private millis: number;
  private gui: GUI;

  private loadedScene: string;

  /* image rendering info */
  private scene: HTMLImageElement; 
  private imgRenderPass: RenderPass;
  private tex: WebGLTexture;
  /* Global Rendering Info */
  private lightPosition: Vec4;

  private canvas2d: HTMLCanvasElement;
  private ctx2: CanvasRenderingContext2D | null;


  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.canvas2d = document.getElementById("textCanvas") as HTMLCanvasElement;
    this.ctx2 = this.canvas2d.getContext("2d");
    if (this.ctx2) {
      this.ctx2.font = "25px serif";
      this.ctx2.fillStyle = "rgb(139, 58, 58)";
    }

    this.ctx = Debugger.makeDebugContext(this.ctx);
    let gl = this.ctx;

    this.gui = new GUI(this.canvas2d, this);
    this.lightPosition = new Vec4([-10, 10, -10, 1]);

    // img
    this.imgRenderPass = new RenderPass(this.extVAO, gl, imgVSText, imgFSText);
    this.initGui();
    this.millis = new Date().getTime();
  }

  /**
  * Setup the animation. This can be called again to reset the animation.
  */
  public reset(): void {
    this.gui.reset();
    this.setScene(this.loadedScene);
  }

  public initGui(): void {
    let verts = new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]);
    this.imgRenderPass.setIndexBufferData(new Uint32Array([1, 0, 2, 2, 0, 3]))
    this.imgRenderPass.addAttribute("vertPosition", 2, this.ctx.FLOAT, false,
      2 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, verts);

    this.imgRenderPass.setDrawData(this.ctx.TRIANGLES, 6, this.ctx.UNSIGNED_INT, 0);

    const gl = this.ctx;
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);


    const img = new Image();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    };
    this.imgRenderPass.addUniform("uTexture",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.uniform1i(loc, 0);
      });

    this.imgRenderPass.setup();
  }

  public initScene(): void {
    const gl = this.ctx;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.scene);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.gui.reset();
  }


  /** @internal
  * Draws a single frame
  *
  */
  public draw(): void {
    let curr = new Date().getTime();
    let deltaT = curr - this.millis;
    this.millis = curr;
    deltaT /= 1000;

    // idk what this does and was giving error so i took it out
    // if (this.ctx2) {
    //   this.ctx2.clearRect(0, 0, this.ctx2.canvas.width, this.ctx2.canvas.height);
    //   if (this.scene.meshes.length > 0) {
    //     this.ctx2.fillText(this.getGUI().getModeString(), 50, 710);
    //   }
    // }

    // Drawing
    const gl: WebGLRenderingContext = this.ctx;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // null is the default frame buffer
    this.drawScene(0, 0, 800, 800);


  }

  private drawScene(x: number, y: number, width: number, height: number): void {
    const gl: WebGLRenderingContext = this.ctx;
    gl.viewport(x, y, width, height);
    this.imgRenderPass.draw();
  }

  public getGUI(): GUI {
    return this.gui;
  }

  /**
  * Loads and sets the scene from a Collada file
  * @param fileLocation URI for the Collada file
  */
  public setScene(fileLocation: string): void {
    this.loadedScene = fileLocation;
    this.scene = new Image(); 
    this.scene.onload = () => this.initScene();
    this.scene.src = fileLocation;
  }
}

// idt this is being used anywhere
// this was being called in index.js in dist/watercolor but i changed it so im just gonna comment this out
export function initializeCanvas(): void {
  const canvas = document.getElementById("glCanvas") as HTMLCanvasElement;
  /* Start drawing */
  const canvasAnimation: WatercolorAnimation = new WatercolorAnimation(canvas);
  canvasAnimation.start();
  canvasAnimation.setScene("./static/assets/watercolor/nasa.jpg");
}
