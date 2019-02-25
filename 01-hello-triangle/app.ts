class RenderLooper {
    currentFps: number;
    isActive: boolean;
    msLastFrame: number;
    cb: Function;
    totalTime: number;
    msFpsLimit: number;
    run: Function;
    myReq: any;

    constructor(cb: Function, fps: number = 0) {
        this.currentFps = 0;
        this.isActive = false;
        this.msLastFrame = performance.now();
        this.cb = cb;
        this.totalTime = 0;
  
        if (fps) {
            this.msFpsLimit = 1000 / fps;
            this.run = () => {
                const currentTime: number = performance.now();
                const msDt: number = currentTime - this.msLastFrame;
                this.totalTime += msDt;
                
                if (msDt >= this.msFpsLimit) {
                this.cb(msDt, this.totalTime);
                this.currentFps = Math.floor(1000.0 / msDt);
                this.msLastFrame = currentTime;
                }
                if (this.isActive) {
                this.myReq = window.requestAnimationFrame(<FrameRequestCallback>this.run);
                }
            };
        } else {
            this.run = () => {
                const currentTime = performance.now();
                const msDt = (currentTime - this.msLastFrame);
                this.totalTime += msDt;
                this.cb(msDt, this.totalTime);
                this.currentFps = Math.floor(1000.0 / msDt);
                this.msLastFrame = currentTime;
                if (this.isActive) {
                    this.myReq = window.requestAnimationFrame(<FrameRequestCallback>this.run);
                }
            };
        }
    }
  
    changeCb(cb) {
        this.cb = cb;
    }
  
    start() {
        if (!this.isActive) {
            this.msLastFrame = performance.now();
            this.isActive = true;
            this.myReq = window.requestAnimationFrame(<FrameRequestCallback>this.run);
        }
        return this;
    }
  
    stop() {
        if (this.isActive) {
            window.cancelAnimationFrame(this.myReq);
            this.isActive = false;
            this.currentFps = 0;
        }  
        return this;
    }

    clearTotalTime() {
        this.totalTime = 0;
    }

    getFps(): number {
        return this.currentFps;
    }
}


const canvas: HTMLCanvasElement = document.querySelector('#cvs');
const gl: WebGL2RenderingContext = canvas.getContext('webgl2');

const vertexSrc: string = document.querySelector('#vertex').textContent.trim();
const fragmentSrc: string = document.querySelector('#fragment').textContent.trim();

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
const fragShader = gl.createShader(gl.FRAGMENT_SHADER);

gl.shaderSource(vertexShader, vertexSrc);
gl.shaderSource(fragShader, fragmentSrc);

gl.compileShader(vertexShader);
gl.compileShader(fragShader);

if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    throw `vertex shader error: ${gl.getShaderInfoLog(vertexShader)}`;
}

if(!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    throw `fragment shader error: ${gl.getShaderInfoLog(fragShader)}`;
}

const triangle_program = gl.createProgram();
gl.attachShader(triangle_program, vertexShader);
gl.attachShader(triangle_program, fragShader);
gl.linkProgram(triangle_program);

if (!gl.getProgramParameter(triangle_program, gl.LINK_STATUS)) {
    throw gl.getProgramInfoLog(triangle_program);
}

const aPos = gl.getAttribLocation(triangle_program, 'aPos');
const vao = gl.createVertexArray();
const vbo = gl.createBuffer();
gl.bindVertexArray(vao);
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -0.5, -0.5, 0.0,
    0.5, -0.5, 0.0,
    0.0, 0.5, 0.0
]), gl.STATIC_DRAW);
gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPos);

gl.bindVertexArray(null);
const { width, height } = canvas.getBoundingClientRect();
gl.viewport(0, 0, width, height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.DEPTH_TEST);

gl.useProgram(triangle_program);
const uHeight = gl.getUniformLocation(triangle_program, 'uHeight');

const mix = (start, end, percent) => {
    const result = start + (end - start) * percent;
    if (result < start) {
        return start;
    } else if (result > end) {
        return end;
    } else {
        return result;
    }

}

const speed: number = 0.005;
let percent: number = 0;
new RenderLooper(() => {
    percent += speed;
    const height: number = mix(-0.5, 0.5, percent);
    gl.uniform1f(uHeight, height);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

}).start();




