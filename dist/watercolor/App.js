import { Debugger } from "../lib/webglutils/Debugging.js";
import { CanvasAnimation } from "../lib/webglutils/CanvasAnimation.js";
import { GUI } from "./Gui.js";
import { imgVSText, imgFSText } from "./Shaders.js";
import { Vec4 } from "../lib/TSM.js";
import { RenderPass } from "../lib/webglutils/RenderPass.js";
export class WatercolorAnimation extends CanvasAnimation {
    constructor(canvas) {
        super(canvas);
        this.drops = [];
        this.canvas2d = document.getElementById("textCanvas");
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
    reset() {
        this.gui.reset();
        this.setScene(this.loadedScene);
    }
    initGui() {
        let verts = new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]);
        this.imgRenderPass.setIndexBufferData(new Uint32Array([1, 0, 2, 2, 0, 3]));
        this.imgRenderPass.addAttribute("vertPosition", 2, this.ctx.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, verts);
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
        this.imgRenderPass.addUniform("uTexture", (gl, loc) => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.tex);
            gl.uniform1i(loc, 0);
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
        this.updateDrops();
        this.drawDrops();
    }
    drawScene(x, y, width, height) {
        const gl = this.ctx;
        gl.viewport(x, y, width, height);
        this.imgRenderPass.draw();
    }
    spawnDrop(x, y) {
        const gl = this.ctx;
        const pixel = new Uint8Array(4);
        gl.readPixels(x, 800 - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        this.drops.push({
            x, y,
            r: pixel[0], g: pixel[1], b: pixel[2],
            radius: 2,
            maxRadius: 20 + Math.random() * 25,
            opacity: 0.1
        });
    }
    updateDrops() {
        this.drops.forEach(d => {
            d.radius += (d.maxRadius - d.radius) * 0.07;
            d.opacity *= 0.97;
        });
        this.drops = this.drops.filter(d => d.opacity > 0.015);
    }
    drawDrops() {
        if (!this.ctx2)
            return;
        this.drops.forEach(d => {
            const grad = this.ctx2.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.radius);
            grad.addColorStop(0, `rgba(${d.r},${d.g},${d.b},${d.opacity * 0.15})`);
            grad.addColorStop(0.7, `rgba(${d.r},${d.g},${d.b},${d.opacity * 0.45})`);
            grad.addColorStop(1.0, `rgba(${d.r},${d.g},${d.b},0)`);
            this.ctx2.fillStyle = grad;
            this.ctx2.beginPath();
            this.ctx2.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
            this.ctx2.fill();
            this.ctx2.strokeStyle = `rgba(${d.r * 0.5},${d.g * 0.5},${d.b * 0.5},${d.opacity * 0.3})`;
            this.ctx2.lineWidth = 1.5;
            this.ctx2.stroke();
        });
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