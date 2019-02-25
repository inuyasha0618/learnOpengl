export default class Mesh {
    gl: WebGL2RenderingContext;
    VAO: WebGLVertexArrayObject;
    IBO: WebGLBuffer;
    counts: number;
    constructor(gl: WebGL2RenderingContext, posArr: Array<number>, uvArr: Array<number>, normArr: Array<number>, idxArr: Array<number>) {
        this.VAO = gl.createVertexArray();
        gl.bindVertexArray(this.VAO);

        const posVBO: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(posArr), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        if (normArr.length) {
            const normVBO: WebGLBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normVBO);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normArr), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        }

        if (uvArr.length) {
            const uvVBO: WebGLBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, uvVBO);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvArr), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
        }

        const IBO: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IBO);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idxArr), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindVertexArray(null);

        this.gl = gl;
        this.IBO = IBO;
        this.counts = idxArr.length;
    }

    draw(): void {
        const gl: WebGL2RenderingContext = this.gl;
        gl.bindVertexArray(this.VAO);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IBO);
        gl.drawElements(gl.TRIANGLES, this.counts, gl.UNSIGNED_INT, 0);
        gl.bindVertexArray(null);
    }
}