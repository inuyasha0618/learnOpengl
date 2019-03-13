let cubeVAO: WebGLVertexArrayObject;
function drawCube(gl: WebGL2RenderingContext): void {
    if (!cubeVAO) {
        cubeVAO = gl.createVertexArray();
        gl.bindVertexArray(cubeVAO);
        const vertexData: Float32Array = new Float32Array([
            // back face
            -1.0, -1.0, -1.0,  -1.0, -1.0, -1.0, 0.0, 0.0, // bottom-left
             1.0,  1.0, -1.0,  1.0,  1.0, -1.0, 1.0, 1.0, // top-right
             1.0, -1.0, -1.0,  1.0, -1.0, -1.0, 1.0, 0.0, // bottom-right         
             1.0,  1.0, -1.0,  1.0,  1.0, -1.0, 1.0, 1.0, // top-right
            -1.0, -1.0, -1.0,  -1.0, -1.0, -1.0, 0.0, 0.0, // bottom-left
            -1.0,  1.0, -1.0,  -1.0,  1.0, -1.0, 0.0, 1.0, // top-left
            // front face
            -1.0, -1.0,  1.0,  -1.0, -1.0,  1.0, 0.0, 0.0, // bottom-left
             1.0, -1.0,  1.0,  1.0, -1.0,  1.0, 1.0, 0.0, // bottom-right
             1.0,  1.0,  1.0,  1.0,  1.0,  1.0, 1.0, 1.0, // top-right
             1.0,  1.0,  1.0,  1.0,  1.0,  1.0, 1.0, 1.0, // top-right
            -1.0,  1.0,  1.0,  -1.0,  1.0,  1.0, 0.0, 1.0, // top-left
            -1.0, -1.0,  1.0,  -1.0, -1.0,  1.0, 0.0, 0.0, // bottom-left
            // left face
            -1.0,  1.0,  1.0, -1.0,  1.0,  1.0, 1.0, 0.0, // top-right
            -1.0,  1.0, -1.0, -1.0,  1.0, -1.0, 1.0, 1.0, // top-left
            -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 0.0, 1.0, // bottom-left
            -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 0.0, 1.0, // bottom-left
            -1.0, -1.0,  1.0, -1.0, -1.0,  1.0, 0.0, 0.0, // bottom-right
            -1.0,  1.0,  1.0, -1.0,  1.0,  1.0, 1.0, 0.0, // top-right
            // right face
             1.0,  1.0,  1.0,  1.0,  1.0,  1.0, 1.0, 0.0, // top-left
             1.0, -1.0, -1.0,  1.0, -1.0, -1.0, 0.0, 1.0, // bottom-right
             1.0,  1.0, -1.0,  1.0,  1.0, -1.0, 1.0, 1.0, // top-right         
             1.0, -1.0, -1.0,  1.0, -1.0, -1.0, 0.0, 1.0, // bottom-right
             1.0,  1.0,  1.0,  1.0,  1.0,  1.0, 1.0, 0.0, // top-left
             1.0, -1.0,  1.0,  1.0, -1.0,  1.0, 0.0, 0.0, // bottom-left     
            // bottom face
            -1.0, -1.0, -1.0,  -1.0, -1.0, -1.0, 0.0, 1.0, // top-right
             1.0, -1.0, -1.0,  1.0, -1.0, -1.0, 1.0, 1.0, // top-left
             1.0, -1.0,  1.0,  1.0, -1.0,  1.0, 1.0, 0.0, // bottom-left
             1.0, -1.0,  1.0,  1.0, -1.0,  1.0, 1.0, 0.0, // bottom-left
            -1.0, -1.0,  1.0,  -1.0, -1.0,  1.0, 0.0, 0.0, // bottom-right
            -1.0, -1.0, -1.0,  -1.0, -1.0, -1.0, 0.0, 1.0, // top-right
            // top face
            -1.0,  1.0, -1.0,  -1.0,  1.0, -1.0, 0.0, 1.0, // top-left
             1.0,  1.0,  1.0,  1.0,  1.0,  1.0, 1.0, 0.0, // bottom-right
             1.0,  1.0, -1.0,  1.0,  1.0, -1.0, 1.0, 1.0, // top-right     
             1.0,  1.0,  1.0,  1.0,  1.0,  1.0, 1.0, 0.0, // bottom-right
            -1.0,  1.0, -1.0,  -1.0,  1.0, -1.0, 0.0, 1.0, // top-left
            -1.0,  1.0,  1.0,  -1.0,  1.0,  1.0, 0.0, 0.0  // bottom-left  
        ]);
        const vertexVBO: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexVBO);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 6 * Float32Array.BYTES_PER_ELEMENT);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }
    gl.bindVertexArray(cubeVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    gl.bindVertexArray(null);
}

export default drawCube;