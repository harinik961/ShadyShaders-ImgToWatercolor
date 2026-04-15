import { Camera } from "../lib/webglutils/Camera.js";
import { CanvasAnimation } from "../lib/webglutils/CanvasAnimation.js";
import { WatercolorAnimation } from "./App.js";
import { Mat4, Vec3, Vec4, Vec2, Mat2, Quat } from "../lib/TSM.js";
import { RenderPass } from "../lib/webglutils/RenderPass.js";

/**
 * Might be useful for designing any animation GUI
 */
interface IGUI {
  viewMatrix(): Mat4;
  projMatrix(): Mat4;
  onKeydown(ke: KeyboardEvent): void;
}

/**
 * Handles Mouse and Button events along with
 * the the camera.
 */

export class GUI implements IGUI {
  private static readonly rotationSpeed: number = 0.05;
  private static readonly zoomSpeed: number = 0.1;
  private static readonly rollSpeed: number = 0.1;
  private static readonly panSpeed: number = 0.1;

  private camera: Camera;
  private fps: boolean;
  private prevX: number;
  private prevY: number;

  private height: number;
  private viewPortHeight: number;
  private width: number;

  private animation: WatercolorAnimation;

  public time: number;

  public hoverX: number = 0;
  public hoverY: number = 0;


  /**
   *
   * @param canvas required to get the width and height of the canvas
   * @param animation required as a back pointer for some of the controls
   * @param sponge required for some of the controls
   */
  constructor(canvas: HTMLCanvasElement, animation: WatercolorAnimation) {
    this.height = canvas.height;
    this.viewPortHeight = this.height - 200;
    this.width = canvas.width;
    this.prevX = 0;
    this.prevY = 0;

    this.animation = animation;

    this.reset();

    this.registerEventListeners(canvas);
  }


  public getTime(): number {
    return this.time;
  }


  /**
   * Resets the state of the GUI
   */
  public reset(): void {
    this.fps = false;
    this.time = 0;

    this.camera = new Camera(
      new Vec3([0, 0, -6]),
      new Vec3([0, 0, 0]),
      new Vec3([0, 1, 0]),
      45,
      this.width / this.viewPortHeight,
      0.1,
      1000.0
    );
  }

  /**
   * Sets the GUI's camera to the given camera
   * @param cam a new camera
   */
  public setCamera(
    pos: Vec3,
    target: Vec3,
    upDir: Vec3,
    fov: number,
    aspect: number,
    zNear: number,
    zFar: number
  ) {
    this.camera = new Camera(pos, target, upDir, fov, aspect, zNear, zFar);
  }

  /**
   * Returns the view matrix of the camera
   */
  public viewMatrix(): Mat4 {
    return this.camera.viewMatrix();
  }

  /**
   * Returns the projection matrix of the camera
   */
  public projMatrix(): Mat4 {
    return this.camera.projMatrix();
  }


  /**
   * Callback function for a key press event
   * @param key
   */
  public onKeydown(key: KeyboardEvent): void {
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
  private registerEventListeners(canvas: HTMLCanvasElement): void {
  window.addEventListener("keydown", (key: KeyboardEvent) => this.onKeydown(key));

  canvas.addEventListener("mousedown", (mouse: MouseEvent) => this.dragStart(mouse));
  canvas.addEventListener("mousemove", (mouse: MouseEvent) => this.drag(mouse));
  canvas.addEventListener("mouseup", (mouse: MouseEvent) => this.dragEnd(mouse));
  canvas.addEventListener("contextmenu", (event: any) => event.preventDefault());
}  // <-- close here

private dragging: boolean = false;

private dragStart(mouse: MouseEvent): void {
  console.log("drag start", mouse.offsetX, mouse.offsetY);
  this.dragging = true;
  this.animation.spawnDrop(mouse.offsetX, mouse.offsetY);
}

private drag(mouse: MouseEvent): void {
  if (this.dragging) {
    this.animation.spawnDrop(mouse.offsetX, mouse.offsetY);
  }
}

private dragEnd(mouse: MouseEvent): void {
  this.dragging = false;
}

  
}