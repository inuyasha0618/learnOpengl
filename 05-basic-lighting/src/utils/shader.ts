export default class Shader {
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

    setUniformInt(name: string, value: number) {
        const location = this.gl.getUniformLocation(this.program, name);
        this.gl.uniform1i(location, value);
    }

    uniformMatrix4fv(name: string, data: Float32Array) {
        const location = this.gl.getUniformLocation(this.program, name);
        this.gl.uniformMatrix4fv(location, false, data);
    }

    uniform3fv(name: string, data: Float32Array) {
        const location = this.gl.getUniformLocation(this.program, name);
        this.gl.uniform3fv(location, data);
    }

    uniform1f(name: string, data: number) {
        const location = this.gl.getUniformLocation(this.program, name);
        this.gl.uniform1f(location, data);
    }
}