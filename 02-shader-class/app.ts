class Shader {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    constructor(gl: WebGL2RenderingContext, vertexSrc: string, fragSrc: string) {
        this.gl = gl;
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSrc);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            throw `Vertex shader compile error: ${gl.getShaderInfoLog(vertexShader)}`;
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragSrc);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            throw `Fragment shader compile error: ${gl.getShaderInfoLog(fragmentShader)}`;
        }

        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw `Program link error: ${gl.getProgramInfoLog(this.program)}`;
        }

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
    }

    use(): void {
        this.gl.useProgram(this.program);
    }

    getAttribLocation(name: string) {
        return this.gl.getAttribLocation(this.program, name);
    }
}

const canvas: HTMLCanvasElement = document.querySelector('#cvs');
const gl: WebGL2RenderingContext = canvas.getContext('webgl2');

const vertexSrc: string = document.querySelector('#vertex').textContent.trim();
const fragmentSrc: string = document.querySelector('#fragment').textContent.trim();

const triangle_program: Shader = new Shader(gl, vertexSrc, fragmentSrc);

const aPos = triangle_program.getAttribLocation('aPos');
// const aPos = gl.getAttribLocation(triangle_program, 'aPos');
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
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

gl.bindVertexArray(vao);
triangle_program.use()
gl.drawArrays(gl.TRIANGLES, 0, 3);


