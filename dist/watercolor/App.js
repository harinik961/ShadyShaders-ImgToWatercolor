import { Debugger } from "../lib/webglutils/Debugging.js";
import { CanvasAnimation } from "../lib/webglutils/CanvasAnimation.js";
import { GUI } from "./Gui.js";
import { imgVSText, imgFSText } from "./Shaders.js";
import { Vec4 } from "../lib/TSM.js";
import { RenderPass } from "../lib/webglutils/RenderPass.js";
export class WatercolorAnimation extends CanvasAnimation {
    constructor(canvas) {
        super(canvas);
        this.maskDirty = true;
        this.isPainting = false;
        this.brushRadius = 0.08;
        this.lastDrop = null;
        this.canvas2d = document.getElementById("textCanvas");
        this.ctx2 = this.canvas2d.getContext("2d");
        if (this.ctx2) {
            this.ctx2.font = "25px serif";
            this.ctx2.fillStyle = "rgb(139, 58, 58)";
        }
        this.maskCanvas = document.createElement("canvas");
        this.maskCanvas.width = 512;
        this.maskCanvas.height = 512;
        this.maskCtx = this.maskCanvas.getContext("2d");
        this.canvas2d.addEventListener("mousedown", (e) => {
            this.isPainting = true;
            this.addDrop(e);
        });
        this.canvas2d.addEventListener("mousemove", (e) => {
            if (this.isPainting)
                this.addDrop(e);
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
    paintAt(xNorm, yNorm) {
        if (!this.maskCtx)
            return;
        const w = this.maskCanvas.width;
        const h = this.maskCanvas.height;
        const x = xNorm * w;
        const y = yNorm * h;
        const r = this.brushRadius * Math.max(w, h);
        const grad = this.maskCtx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, "rgba(255,255,255,0.5)");
        grad.addColorStop(0.7, "rgba(255,255,255,0.2)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        this.maskCtx.fillStyle = grad;
        this.maskCtx.beginPath();
        this.maskCtx.arc(x, y, r, 0, Math.PI * 2);
        this.maskCtx.fill();
        this.maskDirty = true;
    }
    addDrop(e) {
        const rect = this.canvas2d.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
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
        }
        else {
            this.paintAt(x, y);
        }
        this.lastDrop = [x, y];
    }
    clearMask() {
        if (!this.maskCtx)
            return;
        this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        this.maskDirty = true;
    }
    /**
    * Setup the animation. This can be called again to reset the animation.
    */
    reset() {
        this.gui.reset();
        this.clearMask();
        this.lastDrop = null;
        this.isPainting = false;
        this.setScene(this.loadedScene);
    }
    initGui() {
        let verts = new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]);
        const texCoords = new Float32Array([
            0, 0,
            0, 1,
            1, 1,
            1, 0
        ]);
        this.imgRenderPass.setIndexBufferData(new Uint32Array([1, 0, 2, 2, 0, 3]));
        this.imgRenderPass.addAttribute("vertPosition", 2, this.ctx.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, verts);
        this.imgRenderPass.addAttribute("vTexCoord", 2, this.ctx.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, texCoords);
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
        this.imgRenderPass.addUniform("uTexture", (gl, loc) => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.tex);
            gl.uniform1i(loc, 0);
        });
        this.imgRenderPass.addUniform("u_maskTex", (gl, loc) => {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
            if (this.maskDirty) {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.maskCanvas);
                this.maskDirty = false;
            }
            gl.uniform1i(loc, 1);
        });
        this.imgRenderPass.addUniform("u_dropCenter", (gl, loc) => {
            gl.uniform2f(loc, 0.5, 0.5); // center of image for now
        });
        this.imgRenderPass.addUniform("u_dropRadius", (gl, loc) => {
            gl.uniform1f(loc, 1); // covers whole image for now
        });
        this.imgRenderPass.addUniform("u_numLayers", (gl, loc) => {
            gl.uniform1i(loc, 6);
        });
        // lowered amounts to make it less blocky
        this.imgRenderPass.addUniform("u_layerBlur", (gl, loc) => {
            gl.uniform1fv(loc, new Float32Array([0.02, 0.015, 0.012, 0.010, 0.005, 0.002]));
        });
        this.imgRenderPass.addUniform("u_layerOpacity", (gl, loc) => {
            gl.uniform1fv(loc, new Float32Array([.4, .5, .6, .7, .8, .9]));
        });
        this.imgRenderPass.setup();
    }
    initScene() {
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
    draw() {
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
        const gl = this.ctx;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.frontFace(gl.CCW);
        gl.cullFace(gl.BACK);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); // null is the default frame buffer
        this.drawScene(0, 0, 800, 800);
    }
    drawScene(x, y, width, height) {
        const gl = this.ctx;
        gl.viewport(x, y, width, height);
        this.imgRenderPass.draw();
    }
    getGUI() {
        return this.gui;
    }
    /**
    * Loads and sets the scene from a Collada file
    * @param fileLocation URI for the Collada file
    */
    setScene(fileLocation) {
        this.loadedScene = fileLocation;
        this.clearMask();
        this.lastDrop = null;
        this.isPainting = false;
        this.scene = new Image();
        this.scene.onload = () => this.initScene();
        this.scene.src = fileLocation;
    }
}
// idt this is being used anywhere
// this was being called in index.js in dist/watercolor but i changed it so im just gonna comment this out
export function initializeCanvas() {
    const canvas = document.getElementById("glCanvas");
    /* Start drawing */
    const canvasAnimation = new WatercolorAnimation(canvas);
    canvasAnimation.start();
    canvasAnimation.setScene("./static/assets/watercolor/nasa.jpg");
}
//# sourceMappingURL=App.js.map