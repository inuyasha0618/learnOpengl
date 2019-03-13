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
    private canvas: HTMLCanvasElement;

    public position: vec3 = vec3.create();
    private front: vec3 = vec3.create();
    private up: vec3 = vec3.create();
    private right: vec3 = vec3.create();
    private yaw: number;
    private pitch: number;
    private radius: number;

    private movementSpeed: number;
    private mouseSensitivity: number;
    private fov: number;

    private prevX: number = 0;
    private prevY: number = 0;

    private canvasLeft: number;
    private canvasTop: number;

    private lastKeyPressTime: number = 0;
    private ratio: number;
    private near: number;
    private far: number;

    constructor(gl: WebGL2RenderingContext, radius: number, yaw: number = YAW, pitch: number = PITCH, ratio: number, near: number = 0.01, far: number = 1000) {
        this.canvas = gl.canvas;
        const { left, top }  = this.canvas.getBoundingClientRect();
        this.canvasLeft = left;
        this.canvasTop = top;
        this.ratio = ratio;
        this.near = near;
        this.far = far;

        this.radius = radius;
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

    updateRatio(ratio: number): void {
        this.ratio = ratio;
        const { left, top }  = this.canvas.getBoundingClientRect();
        this.canvasLeft = left;
        this.canvasTop = top;
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

        vec3.set(this.position, -this.radius * this.front[0], -this.radius * this.front[1], -this.radius * this.front[2])
    }

    getViewMatrix(): mat4 {
        const viewMatrix: mat4 = mat4.create();
        const target: vec3 = vec3.create();
        // vec3.add(target, this.position, this.front);
        mat4.lookAt(viewMatrix, this.position, target, this.up);
        return viewMatrix;
    }

    getPerspectiveMatrix(): mat4 {
        const perspective: mat4 = mat4.create();
        mat4.perspective(perspective, this.fov, this.ratio, this.near, this.far);
        return perspective;
    }

    getViewDirection(): vec3 {
        const viewDir: vec3 = vec3.create();
        vec3.subtract(viewDir, [0, 0, 0], this.position);
        return viewDir;
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

    addYaw(delta: number): void {
        this.yaw += delta;
        this.updateCameraVectors();
    }

    addPitch(delta: number): void {
        this.pitch += delta;
        this.updateCameraVectors();
    }

    handleMouseDown(e) {
        this.prevX = e.pageX - this.canvasLeft;
        this.prevY = e.pageY - this.canvasTop;
        this.canvas.addEventListener('mousemove',  this.handleMouseMove);
        this.canvas.addEventListener('mouseup',  this.handleMouseUp);
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    }

    handleMouseUp(e) {
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    }

    handleMouseLeave(e) {
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
        const moveMent = this.movementSpeed * 0.9;
        const moveMentVec = vec3.create();
        switch (e.keyCode) {
            case FORWARD:
                this.radius -= moveMent;
                if (this.radius < 0) this.radius = 0;
                vec3.set(this.position, -this.radius * this.front[0], -this.radius * this.front[1], -this.radius * this.front[2]);
                break;
            case BACK:
                this.radius += moveMent;
                vec3.set(this.position, -this.radius * this.front[0], -this.radius * this.front[1], -this.radius * this.front[2]);
                break;
        }
        vec3.add(this.position, this.position, moveMentVec);
    }

    registerMouseEvent() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('wheel', this.handleMouseWheel);
        document.addEventListener('keydown', this.handleKeyPress);
    }

    getPosition(): vec3 {
        return this.position;
    }
}

export default Camera;