var RenderLooper = /** @class */ (function () {
    function RenderLooper(cb, fps) {
        if (fps === void 0) { fps = 0; }
        var _this = this;
        this.currentFps = 0;
        this.isActive = false;
        this.msLastFrame = performance.now();
        this.cb = cb;
        this.totalTime = 0;
        if (fps) {
            this.msFpsLimit = 1000 / fps;
            this.run = function () {
                var currentTime = performance.now();
                var msDt = currentTime - _this.msLastFrame;
                _this.totalTime += msDt;
                if (msDt >= _this.msFpsLimit) {
                    _this.cb(msDt, _this.totalTime);
                    _this.currentFps = Math.floor(1000.0 / msDt);
                    _this.msLastFrame = currentTime;
                }
                if (_this.isActive) {
                    _this.myReq = window.requestAnimationFrame(_this.run);
                }
            };
        }
        else {
            this.run = function () {
                var currentTime = performance.now();
                var msDt = (currentTime - _this.msLastFrame);
                _this.totalTime += msDt;
                _this.cb(msDt, _this.totalTime);
                _this.currentFps = Math.floor(1000.0 / msDt);
                _this.msLastFrame = currentTime;
                if (_this.isActive) {
                    _this.myReq = window.requestAnimationFrame(_this.run);
                }
            };
        }
    }
    RenderLooper.prototype.changeCb = function (cb) {
        this.cb = cb;
    };
    RenderLooper.prototype.start = function () {
        if (!this.isActive) {
            this.msLastFrame = performance.now();
            this.isActive = true;
            this.myReq = window.requestAnimationFrame(this.run);
        }
        return this;
    };
    RenderLooper.prototype.stop = function () {
        if (this.isActive) {
            window.cancelAnimationFrame(this.myReq);
            this.isActive = false;
            this.currentFps = 0;
        }
        return this;
    };
    RenderLooper.prototype.clearTotalTime = function () {
        this.totalTime = 0;
    };
    RenderLooper.prototype.getFps = function () {
        return this.currentFps;
    };
    return RenderLooper;
}());
var canvas = document.querySelector('#cvs');
var gl = canvas.getContext('webgl2');
var vertexSrc = document.querySelector('#vertex').textContent.trim();
var fragmentSrc = document.querySelector('#fragment').textContent.trim();
var vertexShader = gl.createShader(gl.VERTEX_SHADER);
var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(vertexShader, vertexSrc);
gl.shaderSource(fragShader, fragmentSrc);
gl.compileShader(vertexShader);
gl.compileShader(fragShader);
if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    throw "vertex shader error: " + gl.getShaderInfoLog(vertexShader);
}
if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    throw "fragment shader error: " + gl.getShaderInfoLog(fragShader);
}
var triangle_program = gl.createProgram();
gl.attachShader(triangle_program, vertexShader);
gl.attachShader(triangle_program, fragShader);
gl.linkProgram(triangle_program);
if (!gl.getProgramParameter(triangle_program, gl.LINK_STATUS)) {
    throw gl.getProgramInfoLog(triangle_program);
}
var aPos = gl.getAttribLocation(triangle_program, 'aPos');
var vao = gl.createVertexArray();
var vbo = gl.createBuffer();
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
var _a = canvas.getBoundingClientRect(), width = _a.width, height = _a.height;
gl.viewport(0, 0, width, height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.DEPTH_TEST);
gl.useProgram(triangle_program);
var uHeight = gl.getUniformLocation(triangle_program, 'uHeight');
var mix = function (start, end, percent) {
    var result = start + (end - start) * percent;
    if (result < start) {
        return start;
    }
    else if (result > end) {
        return end;
    }
    else {
        return result;
    }
};
var speed = 0.005;
var percent = 0;
new RenderLooper(function () {
    percent += speed;
    var height = mix(-0.5, 0.5, percent);
    gl.uniform1f(uHeight, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}).start();
