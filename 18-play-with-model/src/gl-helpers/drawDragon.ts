import { loadObjFile } from '../utils/index';

let dragonPosDataArr: Float32Array;
let dragonNormalDataArr: Float32Array;
let dragonUVDataArr: Float32Array;
let dragonVAO: WebGLVertexArrayObject;
loadObjFile('../models/TheStanfordDragon.obj').then(({
    vertex_pos_data,
    output_smooth_normals,
    vertex_uv_data
}) => {
    dragonPosDataArr = vertex_pos_data;
    dragonNormalDataArr = output_smooth_normals;
    dragonUVDataArr = vertex_uv_data;
})

function drawDragon(gl: WebGL2RenderingContext): void {
    if (!dragonPosDataArr) return;
    if (!dragonVAO) {
        dragonVAO = gl.createVertexArray();
        gl.bindVertexArray(dragonVAO);

        const dragonPosBuffer: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, dragonPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, dragonPosDataArr, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        const dragonNormalBuffer: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, dragonNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, dragonNormalDataArr, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

        const dragonTexBuffer: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, dragonTexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, dragonUVDataArr, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    gl.bindVertexArray(dragonVAO);
    gl.drawArrays(gl.TRIANGLES, 0, dragonPosDataArr.length / 3);
    gl.bindVertexArray(null);
}

export default drawDragon;