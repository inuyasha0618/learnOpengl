var imgLoader = function (url) {
    var image = new Image();
    image.src = url;
    return new Promise(function (resolve, reject) {
        image.onload = function () {
            resolve(image);
        };
        image.onerror = reject;
    });
};
var Shader = /** @class */ (function () {
    function Shader(gl, vertexSrc, fragSrc) {
        this.gl = gl;
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSrc);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            throw "Vertex shader compile error: " + gl.getShaderInfoLog(vertexShader);
        }
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragSrc);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            throw "Fragment shader compile error: " + gl.getShaderInfoLog(fragmentShader);
        }
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw "Program link error: " + gl.getProgramInfoLog(this.program);
        }
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
    }
    Shader.prototype.use = function () {
        this.gl.useProgram(this.program);
    };
    Shader.prototype.getAttribLocation = function (name) {
        return this.gl.getAttribLocation(this.program, name);
    };
    Shader.prototype.setUniformInt = function (name, value) {
        var location = this.gl.getUniformLocation(this.program, name);
        this.gl.uniform1i(location, value);
    };
    return Shader;
}());
var canvas = document.querySelector('#cvs');
var gl = canvas.getContext('webgl2');
var vertexSrc = document.querySelector('#vertex').textContent.trim();
var fragmentSrc = document.querySelector('#fragment').textContent.trim();
var program = new Shader(gl, vertexSrc, fragmentSrc);
var vbo = gl.createBuffer();
var ebo = gl.createBuffer();
var vao = gl.createVertexArray();
gl.bindVertexArray(vao);
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0,
    0.5, -0.5, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,
    0.5, 0.5, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0,
    -0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0
]), gl.STATIC_DRAW);
var aPos = program.getAttribLocation('aPos');
var aColor = program.getAttribLocation('aColor');
var aSt = program.getAttribLocation('aSt');
gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0);
gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
gl.vertexAttribPointer(aSt, 2, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 6 * Float32Array.BYTES_PER_ELEMENT);
gl.enableVertexAttribArray(aPos);
gl.enableVertexAttribArray(aColor);
gl.enableVertexAttribArray(aSt);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
    0, 3, 1,
    1, 2, 3
]), gl.STATIC_DRAW);
gl.bindVertexArray(null);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
var _a = canvas.getBoundingClientRect(), width = _a.width, height = _a.height;
gl.viewport(0, 0, width, height);
gl.enable(gl.DEPTH_TEST);
Promise.all([imgLoader('../images/container.jpg'), imgLoader('../images/awesomeface.png')])
    .then(function (_a) {
    var container = _a[0], smile = _a[1];
    var texture1 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, container.width, container.height, 0, gl.RGB, gl.UNSIGNED_BYTE, container);
    gl.generateMipmap(gl.TEXTURE_2D);
    var texture2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, smile.width, smile.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, smile);
    gl.generateMipmap(gl.TEXTURE_2D);
    program.use();
    program.setUniformInt('wood', 0);
    program.setUniformInt('smile', 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.bindVertexArray(vao);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
});
