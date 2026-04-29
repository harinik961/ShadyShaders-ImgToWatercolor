import { Debugger } from "../lib/webglutils/Debugging.js";
import {
  CanvasAnimation,
  WebGLUtilities
} from "../lib/webglutils/CanvasAnimation.js";
import { GUI } from "./Gui.js";
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

  /* paintbrush state */
  private maskCanvas: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D | null;
  private maskTex: WebGLTexture;
  private maskDirty: boolean = true;
  private isPainting: boolean = false;
  private brushRadius: number = 0.07;
  private lastDrop: [number, number] | null = null;

  private startTime: number = 0;      
  private dropCenter: [number, number] = [0.5, 0.5]; 
  private drops: { x: number; y: number; start: number }[] = [];


  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.canvas2d = document.getElementById("textCanvas") as HTMLCanvasElement;
    this.ctx2 = this.canvas2d.getContext("2d");
    if (this.ctx2) {
      this.ctx2.font = "25px serif";
      this.ctx2.fillStyle = "rgb(139, 58, 58)";
    }

    this.maskCanvas = document.createElement("canvas");
    this.maskCanvas.width = 512;
    this.maskCanvas.height = 512;
    this.maskCtx = this.maskCanvas.getContext("2d");

    this.canvas2d.addEventListener("mousedown", (e: MouseEvent) => {
      this.isPainting = true;
      this.addDrop(e);
    });
    this.canvas2d.addEventListener("mousemove", (e: MouseEvent) => {
      if (this.isPainting) this.addDrop(e);
    });
    this.canvas2d.addEventListener("mouseup", () => {
      this.isPainting = false;
      this.lastDrop = null;
    });
    this.canvas2d.addEventListener("mouseleave", () => {
      this.isPainting = false;
      this.lastDrop = null;
    });

    this.ctx = Debugger.makeDebugContext(this.ctx);
    let gl = this.ctx;

    this.gui = new GUI(this.canvas2d, this);
    this.lightPosition = new Vec4([-10, 10, -10, 1]);

    // img
    this.imgRenderPass = new RenderPass(this.extVAO, gl, imgVSText, imgFSText);
    this.initGui();
    this.millis = new Date().getTime();
  }
  
private paintAt(xNorm: number, yNorm: number): void {
  if (!this.maskCtx) return;
  const w = this.maskCanvas.width;
  const h = this.maskCanvas.height;
  const x = xNorm * w;
  const y = yNorm * h;
  const r = this.brushRadius * Math.max(w, h);

  const grad = this.maskCtx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0,   "rgba(255,255,255,1.0)");  
  grad.addColorStop(0.4, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.5)");
  grad.addColorStop(1.0, "rgba(255,255,255,0)");
  this.maskCtx.fillStyle = grad;
  this.maskCtx.beginPath();
  this.maskCtx.arc(x, y, r, 0, Math.PI * 2);
  this.maskCtx.fill();

  this.maskDirty = true;
}

  private addDrop(e: MouseEvent): void {
  const rect = this.canvas2d.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;

  this.dropCenter = [x, y];  
  this.startTime = performance.now();

  if (this.lastDrop) {
    const dx = x - this.lastDrop[0];
    const dy = y - this.lastDrop[1];
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = this.brushRadius * 0.25;
    const numSteps = Math.max(1, Math.ceil(dist / step));

    for (let i = 1; i <= numSteps; i++) {
      const t = i / numSteps;
      this.paintAt(this.lastDrop[0] + dx * t, this.lastDrop[1] + dy * t);
    }
  } else {
    this.paintAt(x, y);
  }

  this.lastDrop = [x, y];
  this.drops.push({x, y,start: performance.now()});

}

  private clearMask(): void {
    if (!this.maskCtx) return;
    this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
    this.maskDirty = true;
  }

  /**
  * Setup the animation. This can be called again to reset the animation.
  */
  public reset(): void {
    this.gui.reset();
    this.clearMask();
    this.lastDrop = null;
    this.isPainting = false;
    this.setScene(this.loadedScene);
  }

  public initGui(): void {
    let verts = new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]);
    const texCoords = new Float32Array([
      0, 0,
      0, 1,
      1, 1,
      1, 0
    ]);
    this.imgRenderPass.setIndexBufferData(new Uint32Array([1, 0, 2, 2, 0, 3]));
    this.imgRenderPass.addAttribute("vertPosition", 2, this.ctx.FLOAT, false,
      2 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, verts);
    this.imgRenderPass.addAttribute("vTexCoord", 2, this.ctx.FLOAT, false,
      2 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, texCoords);
    this.imgRenderPass.setDrawData(this.ctx.TRIANGLES, 6, this.ctx.UNSIGNED_INT, 0);

    const gl = this.ctx;
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);

    this.maskTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.maskCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);


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

    this.imgRenderPass.addUniform("u_maskTex",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
        if (this.maskDirty) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.maskCanvas);
          this.maskDirty = false;
        }
        gl.uniform1i(loc, 1);
      });

    this.imgRenderPass.addUniform("u_numLayers",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        gl.uniform1i(loc, 6);
      }
    );
    this.imgRenderPass.addUniform("u_layerBlur", (gl,loc)=>{
      gl.uniform1fv(loc, new Float32Array([0.02, 0.015, 0.012, 0.010, 0.005, 0.002]));
    });
    
    this.imgRenderPass.addUniform("u_layerOpacity", (gl, loc)=>{
      gl.uniform1fv(loc, new Float32Array([.4, .5, .6, .7, .8, .9]));
    });

    this.imgRenderPass.addUniform("u_time",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        const elapsed = (performance.now() - this.startTime) / 1000.0;
        gl.uniform1f(loc, elapsed);
      });

    this.imgRenderPass.addUniform("u_dropCenter",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        gl.uniform2f(loc, this.dropCenter[0], this.dropCenter[1]);
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

  private paintSoft(xNorm: number, yNorm: number, radius: number, alpha: number): void {
  if (!this.maskCtx) return;

  const w = this.maskCanvas.width;
  const h = this.maskCanvas.height;

  const x = xNorm * w;
  const y = yNorm * h;
  const r = radius * Math.max(w, h);

  const grad = this.maskCtx.createRadialGradient(x, y, 0, x, y, r);

  grad.addColorStop(0,   `rgba(255,255,255,${alpha})`);
  grad.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.6})`);
  grad.addColorStop(1.0, `rgba(255,255,255,0)`);

  this.maskCtx.fillStyle = grad;
  this.maskCtx.beginPath();
  this.maskCtx.arc(x, y, r, 0, Math.PI * 2);
  this.maskCtx.fill();
}

  private updateDrops(): void {
  if (!this.maskCtx) return;

  const now = performance.now();

  for (let i = this.drops.length - 1; i >= 0; i--) {
    const d = this.drops[i];
    const t = (now - d.start) / 1000;

    if (t > 2.0) {
      this.drops.splice(i, 1);
      continue;
    }

    const tNorm = Math.min(t / 1.5, 1.0);    
    const eased = 1.0 - Math.exp(-3.0 * tNorm); 

    const maxScale = 2;
    const radius = this.brushRadius * (1.0 + eased * (maxScale - 1.0));

    const alpha = 1.0 - t * 0.5;

    this.paintSoft(d.x, d.y, radius, alpha);
  }

  this.maskDirty = true;
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

    this.updateDrops();

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
    this.clearMask();
    this.lastDrop = null;
    this.isPainting = false;
    this.scene = new Image();
    this.scene.onload = () => this.initScene();
    this.scene.src = fileLocation;
  }
}

export function initializeCanvas(): void {
  const canvas = document.getElementById("glCanvas") as HTMLCanvasElement;
  /* Start drawing */
  const canvasAnimation: WatercolorAnimation = new WatercolorAnimation(canvas);
  canvasAnimation.start();
  canvasAnimation.setScene("./static/assets/watercolor/nasa.jpg");
}