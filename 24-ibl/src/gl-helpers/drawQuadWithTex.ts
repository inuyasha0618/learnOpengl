let quadVAO: WebGLVertexArrayObject;
function drawQuad(gl: WebGL2RenderingContext): void {
    if (!quadVAO) {
        quadVAO = gl.createVertexArray();
        gl.bindVertexArray(quadVAO);
        const quadData: Float32Array = new Float32Array([
            -1.0,  1.0, 0.0, 0.0, 1.0,
            -1.0, -1.0, 0.0, 0.0, 0.0,
             1.0,  1.0, 0.0, 1.0, 1.0,
             1.0, -1.0, 0.0, 1.0, 0.0
        ]);
        const quadVBO: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
        gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }
    gl.bindVertexArray(quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0 , 4);
    gl.bindVertexArray(null);
}

export default drawQuad;