import { vec3, mat4 } from 'gl-matrix';
// 由于相机滚转没啥用（否则看起来场景在转），所以相机参数只有偏航角和俯仰角
// 偏航角
const YAW: number = 0.0;
// 俯仰角
const PITCH = 0.0;
const SPEED: number = 0.5;
const SENSITIVITY: number = 0.1;
const FOV: number = 45;

const FORWARD = 87;
const BACK = 83;
const LEFT = 65;
const RIGHT = 68;

const radians = deg => deg / 180 * Math.PI;
const sin = Math.sin;
const cos = Math.cos;

class Camera {
    canvas: HTMLCanvasElement;

    position: vec3;
    front: vec3 = vec3.create();
    up: vec3 = vec3.create();
    right: vec3 = vec3.create();
    yaw: number;
    pitch: number;
    movementSpeed: number;
    mouseSensitivity: number;
    fov: number;

    prevX: number = 0;
    prevY: number = 0;

    canvasLeft: number;
    canvasTop: number;

    lastKeyPressTime: number = 0;

    constructor(gl: WebGL2RenderingContext, position: vec3, yaw: number = YAW, pitch: number = PITCH) {
        this.canvas = gl.canvas;
        const { left, top}  = this.canvas.getBoundingClientRect();
        this.canvasLeft = left;
        this.canvasTop = top;
        
        this.position = position;
        this.yaw = yaw;
        this.pitch = pitch;

        vec3.set(this.front, 0.0, 0.0, -1.0);
        this.movementSpeed = SPEED;
        this.mouseSensitivity = SENSITIVITY;
        this.fov = FOV;

        this.updateCameraVectors();        

        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseWheel = this.handleMouseWheel.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);

        this.registerMouseEvent();
    }

    updateCameraVectors() {

        const yaw = radians(this.yaw);
        const pitch = radians(this.pitch);

        const sin_yaw = sin(yaw);
        const cos_yaw = cos(yaw);
        const sin_pitch = sin(pitch);
        const cos_pitch = cos(pitch);

        vec3.set(
            this.front,
            -sin_yaw * cos_pitch,
            sin_pitch,
            -cos_yaw * cos_pitch
        );

        vec3.set(
            this.right,
            cos_yaw,
            0,
            -sin_yaw
        );

        vec3.set(
            this.up,
            sin_yaw * sin_pitch,
            cos_pitch,
            cos_yaw * sin_pitch
        );
    }

    getViewMatrix(): mat4 {
        const viewMatrix: mat4 = mat4.create();
        const target: vec3 = vec3.create();
        vec3.add(target, this.position, this.front);
        mat4.lookAt(viewMatrix, this.position, target, this.up);
        return viewMatrix;
    }

    processMouseMovement(xoffset: number, yoffset: number, constrainPitch: boolean = true) {
        xoffset *= this.mouseSensitivity;
        yoffset *= this.mouseSensitivity;

        this.yaw   -= xoffset;
        this.pitch -= yoffset;

        // Make sure that when pitch is out of bounds, screen doesn't get flipped
        if (constrainPitch)
        {
            if (this.pitch > 89.0)
                this.pitch = 89.0;
            if (this.pitch < -89.0)
                this.pitch = -89.0;
        }

        // Update Front, Right and Up Vectors using the updated Euler angles
        this.updateCameraVectors();
    }

    handleMouseDown(e) {
        this.prevX = e.pageX - this.canvasLeft;
        this.prevY = e.pageY - this.canvasTop;
        this.canvas.addEventListener('mousemove',  this.handleMouseMove);
        this.canvas.addEventListener('mouseup',  this.handleMouseUp);
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    }

    handleMouseLeave(e) {
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    }

    handleMouseUp(e) {
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    }

    handleMouseMove(e) {
        const currentX = e.pageX - this.canvasLeft;
        const currentY = e.pageY - this.canvasTop;
        const dx = currentX - this.prevX;
        const dy = currentY - this.prevY;
        this.prevX = currentX;
        this.prevY = currentY;
        this.processMouseMovement(dx, dy);
    }

    handleMouseWheel(e) {
        let delta = Math.max(-1, Math.min(1, e.deltaY));
        this.fov += delta;
        if (this.fov <= 1.0) {
            this.fov = 1.0;
        } else if (this.fov >= 45.0) {
            this.fov = 45.0;
        }
    }

    handleKeyPress(e) {
        const moveMent = this.movementSpeed * 0.05;
        const moveMentVec = vec3.create();
        switch (e.keyCode) {
            case FORWARD:
                vec3.scale(moveMentVec, this.front, moveMent);
                break;
            case BACK:
                vec3.scale(moveMentVec, this.front, moveMent);
                vec3.negate(moveMentVec, moveMentVec)
                break;
            case LEFT:
                vec3.scale(moveMentVec, this.right, moveMent);
                vec3.negate(moveMentVec, moveMentVec)
                break;
            case RIGHT:
                vec3.scale(moveMentVec, this.right, moveMent);
                break;
        }
        vec3.add(this.position, this.position, moveMentVec);
    }

    registerMouseEvent() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('wheel', this.handleMouseWheel);
        document.addEventListener('keydown', this.handleKeyPress);
    }
}

export default Camera;