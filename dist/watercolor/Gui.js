import { Camera } from "../lib/webglutils/Camera.js";
import { Vec3 } from "../lib/TSM.js";
/**
 * Handles Mouse and Button events along with
 * the the camera.
 */
export class GUI {
    /**
     *
     * @param canvas required to get the width and height of the canvas
     * @param animation required as a back pointer for some of the controls
     * @param sponge required for some of the controls
     */
    constructor(canvas, animation) {
        this.hoverX = 0;
        this.hoverY = 0;
        this.height = canvas.height;
        this.viewPortHeight = this.height - 200;
        this.width = canvas.width;
        this.prevX = 0;
        this.prevY = 0;
        this.animation = animation;
        this.reset();
        this.registerEventListeners(canvas);
    }
    getTime() {
        return this.time;
    }
    /**
     * Resets the state of the GUI
     */
    reset() {
        this.fps = false;
        this.time = 0;
        this.camera = new Camera(new Vec3([0, 0, -6]), new Vec3([0, 0, 0]), new Vec3([0, 1, 0]), 45, this.width / this.viewPortHeight, 0.1, 1000.0);
    }
    /**
     * Sets the GUI's camera to the given camera
     * @param cam a new camera
     */
    setCamera(pos, target, upDir, fov, aspect, zNear, zFar) {
        this.camera = new Camera(pos, target, upDir, fov, aspect, zNear, zFar);
    }
    /**
     * Returns the view matrix of the camera
     */
    viewMatrix() {
        return this.camera.viewMatrix();
    }
    /**
     * Returns the projection matrix of the camera
     */
    projMatrix() {
        return this.camera.projMatrix();
    }
    /**
     * Callback function for a key press event
     * @param key
     */
    onKeydown(key) {
        switch (key.code) {
            case "Digit1": {
                this.animation.setScene("./static/assets/watercolor/ghrardeli.webp");
                break;
            }
            case "Digit2": {
                this.animation.setScene("./static/assets/watercolor/nasa.jpg");
                break;
            }
            case "Digit3": {
                this.animation.setScene("./static/assets/watercolor/starburst.png");
                break;
            }
            case "Digit4": {
                this.animation.setScene("./static/assets/watercolor/tree_img.webp");
                break;
            }
            default: {
                console.log("Key : '", key.code, "' was pressed.");
                break;
            }
        }
    }
    /**
     * Registers all event listeners for the GUI
     * @param canvas The canvas being used
     */
    registerEventListeners(canvas) {
        /* Event listener for key controls */
        window.addEventListener("keydown", (key) => this.onKeydown(key));
        // // need to change to watercolor functions we write later
        // /* Event listener for mouse controls */
        // // canvas.addEventListener("mousedown", (mouse: MouseEvent) =>
        // //   this.dragStart(mouse)
        // // );
        // // canvas.addEventListener("mousemove", (mouse: MouseEvent) =>
        // //   this.drag(mouse)
        // // );
        // // canvas.addEventListener("mouseup", (mouse: MouseEvent) =>
        // //   this.dragEnd(mouse)
        // // );
        /* Event listener to stop the right click menu */
        canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    }
}
GUI.rotationSpeed = 0.05;
GUI.zoomSpeed = 0.1;
GUI.rollSpeed = 0.1;
GUI.panSpeed = 0.1;
//# sourceMappingURL=Gui.js.map