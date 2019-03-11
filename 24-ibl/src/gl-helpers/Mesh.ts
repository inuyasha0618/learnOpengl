export default class Mesh {
    private initDone: boolean = false;
    private gl: WebGL2RenderingContext;
    private VAO: WebGLVertexArrayObject;
    private IBO: WebGLBuffer;
    private counts: number;
    private instanceNums: number;
    init(gl: WebGL2RenderingContext, posArr: Array<number>, uvArr: Array<number>, normArr: Array<number>, idxArr: Array<number>, instancedArr: Array<number> = []) {
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

        if (instancedArr.length) {
            const modelVBO: WebGLBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, modelVBO);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(instancedArr), gl.STATIC_DRAW);
    
            gl.enableVertexAttribArray(3);
            gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 0);
    
            gl.enableVertexAttribArray(4);
            gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 4 * Float32Array.BYTES_PER_ELEMENT);
    
            gl.enableVertexAttribArray(5);
            gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 8 * Float32Array.BYTES_PER_ELEMENT);
    
            gl.enableVertexAttribArray(6);
            gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 12 * Float32Array.BYTES_PER_ELEMENT);    
            this.instanceNums = instancedArr.length / 16;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindVertexArray(null);

        this.gl = gl;
        this.IBO = IBO;
        this.counts = idxArr.length;
        this.initDone = true;
    }

    draw(): void {
        if (!this.initDone) return;
        const gl: WebGL2RenderingContext = this.gl;
        gl.bindVertexArray(this.VAO);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IBO);
        if (this.instanceNums) {
            gl.drawElementsInstanced(gl.TRIANGLES, this.counts, gl.UNSIGNED_INT, 0, this.instanceNums);
        } else {
            gl.drawElements(gl.TRIANGLES, this.counts, gl.UNSIGNED_INT, 0);
        }
        gl.bindVertexArray(null);
    }
}