import { vec3, mat4, vec2 } from 'gl-matrix';
import RenderLooper from 'render-looper';
import { getContext, fetchObjFile, resizeCvs2Screen, getRadian } from './utils/index';
import { ShaderProgram, Mesh, loadTex, OrbitCamera, Texture, drawCube, ObjMesh, drawFakeBuilding } from './gl-helpers/index';
import phongVertSrc from './shaders/phongVert';
import pbrFrag from './shaders/pbrFrag';
import lightFrag from './shaders/lightFrag';
import lightVert from './shaders/lightVert';
import instancingVert from './shaders/instancingVert';

const lightPositions: Array<Float32Array> = [
    new Float32Array([-10.0, 10.0, 10.0]),
    new Float32Array([10.0, 10.0, 10.0]),
    new Float32Array([10.0, 10.0, -10.0]),
    new Float32Array([-10.0, 10.0, -10.0]),
]

const lightWeight: number = 500.0;

const lightColors: Array<Float32Array> = [
    new Float32Array([lightWeight, lightWeight * 0.5, 0.0]),
    new Float32Array([lightWeight, lightWeight * 0.5, 0.0]),
    new Float32Array([lightWeight, lightWeight * 0.5, 0.0]),
    new Float32Array([lightWeight, lightWeight * 0.5, 0.0])
];

const lightColors2: Array<Float32Array> = [
    new Float32Array([lightWeight, lightWeight, lightWeight]),
    new Float32Array([lightWeight, lightWeight, lightWeight]),
    new Float32Array([lightWeight, lightWeight, lightWeight]),
    new Float32Array([lightWeight, lightWeight, lightWeight])
];

const gl: WebGL2RenderingContext = getContext('#cvs');
gl.getExtension('EXT_color_buffer_float');

// 获得屏幕尺寸

// 创建shaderprogram

const pbrShaderProgram: ShaderProgram = new ShaderProgram(gl, phongVertSrc, pbrFrag, 'pbrShaderProgram');
pbrShaderProgram.use();
pbrShaderProgram.uniform3fv('albedo', new Float32Array([0.5, 0.5, 0.5]));
pbrShaderProgram.uniform1f('ao', 1.0);
pbrShaderProgram.uniform1f('roughness', 0.3);
pbrShaderProgram.uniform1f('metallic', 1.0);

for (let i = 0; i < 4; i++) {
    pbrShaderProgram.uniform3fv(`lightPositions[${i}]`, lightPositions[i]);
    pbrShaderProgram.uniform3fv(`lightColors[${i}]`, lightColors[i]);
}

const instancingPbrShaderProgram: ShaderProgram = new ShaderProgram(gl, instancingVert, pbrFrag, 'instancingPbrShaderProgram');
instancingPbrShaderProgram.use();
instancingPbrShaderProgram.uniform3fv('albedo', new Float32Array([0.5, 0.5, 0.5]));
instancingPbrShaderProgram.uniform1f('ao', 1.0);
instancingPbrShaderProgram.uniform1f('roughness', 0.3);
instancingPbrShaderProgram.uniform1f('metallic', 1.0);

for (let i = 0; i < 4; i++) {
    instancingPbrShaderProgram.uniform3fv(`lightPositions[${i}]`, lightPositions[i]);
    instancingPbrShaderProgram.uniform3fv(`lightColors[${i}]`, lightColors[i]);
}

const lightShaderProgram: ShaderProgram = new ShaderProgram(gl, lightVert, lightFrag, 'lightShaderProgram');
// lightShaderProgram.use();

const { width: SCR_WIDTH, height: SCR_HEIGHT } = resizeCvs2Screen(gl);


// 创建楼体mesh
const buildingMesh: ObjMesh = new ObjMesh(gl, '../models/Tencent_BinHai.obj');

// 创建相机
const camera: OrbitCamera = new OrbitCamera(gl, 45, 0, -30, SCR_WIDTH / SCR_HEIGHT);
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.0, 0.0, 0.0, 1.0);

function drawCB(msDt: number, totalTime: number): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    camera.addYaw(0.1);
    const view: mat4 = camera.getViewMatrix();
    const perspective: mat4 = camera.getPerspectiveMatrix();
    const model: mat4 = mat4.create();
    // mat4.rotateY(model, model, getRadian(-45));
    mat4.scale(model, model, [0.25, 0.25, 0.25]);

    pbrShaderProgram.use();
    pbrShaderProgram.uniformMatrix4fv('uModel', model);
    pbrShaderProgram.uniformMatrix4fv('uView', view);
    pbrShaderProgram.uniformMatrix4fv('uPerspective', perspective);
    pbrShaderProgram.uniform3fv('camPos', camera.position);
    pbrShaderProgram.uniform3fv('albedo', new Float32Array([0.5, 0.5, 0.5]));

    for (let i = 0; i < 4; i++) {
        pbrShaderProgram.uniform3fv(`lightColors[${i}]`, lightColors[i]);
    }

    buildingMesh.draw();

    // 画出光源的位置
    lightShaderProgram.use();
    lightShaderProgram.uniformMatrix4fv('uView', view);
    lightShaderProgram.uniformMatrix4fv('uPerspective', perspective);
    // for (let i = 0; i < 4; i++) {
    //     const model: mat4 = mat4.create();
    //     const pos: vec3 = vec3.fromValues(lightPositions[i][0], lightPositions[i][1], lightPositions[i][2]);
    //     mat4.translate(model, model, pos);
    //     mat4.scale(model, model, [0.3, 0.3, 0.3]);
    //     lightShaderProgram.uniformMatrix4fv('uModel', model);
    //     lightShaderProgram.uniform3fv('lightColor', lightColors[i]);
    //     drawCube(gl);
    //     ++drawCallCnts;
    //     gl.bindTexture(gl.TEXTURE_2D, null);
    // }

    lightShaderProgram.uniform1f('uTime', totalTime * 0.001);
    drawFreeLights();

    // 画建筑
    instancingPbrShaderProgram.use();
    instancingPbrShaderProgram.uniformMatrix4fv('uView', view);
    instancingPbrShaderProgram.uniformMatrix4fv('uPerspective', perspective);

    drawFakeBuildings();

}

const gridCnts: number = 30;
const gridSize: number = 5;
const buildingPoses: Array<mat4> = [];
function getRandom(start: number, end: number): number {
    return start + (end - start) * Math.random();
}

function generateBuildingPos(gridSize: number, gridCnts: number) {
    const halfWidth: number = gridSize * gridCnts * 0.5;
    // 列主序！！！
    const w2Checkerboard: mat4 = mat4.fromValues(
        1, 0, 0, 0,
        0, 0, 1, 0,
        0, -1, 0, 0,
        -halfWidth, 0, -halfWidth, 1
    );
    
    const discard: number = Math.floor(gridCnts * 0.5);
    
    for (let row = 0; row < gridCnts; row++) {
        for (let column = 0; column < gridCnts; column++) {
            if (row >= discard -2 && row <= discard && column >= discard - 2 && column <= discard) continue;
            const localMx: mat4 = mat4.create();
            mat4.translate(localMx, localMx, [column * gridSize + 0.5 * gridSize, row * gridSize + 0.5 * gridSize, 0]);
            mat4.rotateX(localMx, localMx, getRadian(-90));
            // mat4.rotateY(localMx, localMx, getRadian(90 * Math.random()));
            mat4.scale(localMx, localMx, [0.5 * gridSize, 0.5 * gridSize, 0.5 * gridSize]);
            mat4.scale(localMx, localMx, [getRandom(0.3, 0.5), getRandom(0.5, 1.5), getRandom(0.4, 0.6)])
            const finalModelMx: mat4 = mat4.create();
            mat4.multiply(finalModelMx, w2Checkerboard, localMx);
            buildingPoses.push(finalModelMx);
        }
    }    
}


interface LightInfo {
    lightPos: vec3;
    lightColor: vec3;
    lightId: vec2;
}

function generateLights(gridSize: number, gridCnts: number, freeLights: Array<LightInfo>): void {
    const halfWidth: number = gridSize * gridCnts * 0.5;
    for (let row = 0; row < gridCnts; row++) {
        for (let col = 0; col < gridCnts; col++) {
            // if (Math.random() < 0.35) {
                const pos: vec3 = vec3.fromValues(-halfWidth + col * gridSize, 5, -halfWidth + row * gridSize)
                const currentIdx: number = row * gridCnts + col;
                const lightColor: vec3 = vec3.fromValues(
                    (Math.sin(3.45 * currentIdx * 0.01) * 0.5 + 0.5) * 10,
                    (Math.sin(6.56 * currentIdx * 0.01) * 0.5 + 0.5) * 10,
                    (Math.sin(8.78 * currentIdx * 0.01) * 0.5 + 0.5) * 10,
                )
                freeLights.push({
                    lightPos: pos,
                    lightColor,
                    lightId: vec2.fromValues(col, row)
                })
            // }
        }
    }
}

const freeLights: Array<LightInfo> = [];
generateLights(gridSize, gridCnts, freeLights);

generateBuildingPos(gridSize, gridCnts);
console.log('buildingPoses[0]', buildingPoses[0]);




let freeLightsVAO: WebGLVertexArrayObject;
function drawFreeLights(): void {
    if (!freeLightsVAO) {
        freeLightsVAO = gl.createVertexArray();
        gl.bindVertexArray(freeLightsVAO);
        const vertexData: Float32Array = new Float32Array([
            // back face
            -1.0, -1.0, -1.0,  0.0,  0.0, -1.0, 0.0, 0.0, // bottom-left
             1.0,  1.0, -1.0,  0.0,  0.0, -1.0, 1.0, 1.0, // top-right
             1.0, -1.0, -1.0,  0.0,  0.0, -1.0, 1.0, 0.0, // bottom-right         
             1.0,  1.0, -1.0,  0.0,  0.0, -1.0, 1.0, 1.0, // top-right
            -1.0, -1.0, -1.0,  0.0,  0.0, -1.0, 0.0, 0.0, // bottom-left
            -1.0,  1.0, -1.0,  0.0,  0.0, -1.0, 0.0, 1.0, // top-left
            // front face
            -1.0, -1.0,  1.0,  0.0,  0.0,  1.0, 0.0, 0.0, // bottom-left
             1.0, -1.0,  1.0,  0.0,  0.0,  1.0, 1.0, 0.0, // bottom-right
             1.0,  1.0,  1.0,  0.0,  0.0,  1.0, 1.0, 1.0, // top-right
             1.0,  1.0,  1.0,  0.0,  0.0,  1.0, 1.0, 1.0, // top-right
            -1.0,  1.0,  1.0,  0.0,  0.0,  1.0, 0.0, 1.0, // top-left
            -1.0, -1.0,  1.0,  0.0,  0.0,  1.0, 0.0, 0.0, // bottom-left
            // left face
            -1.0,  1.0,  1.0, -1.0,  0.0,  0.0, 1.0, 0.0, // top-right
            -1.0,  1.0, -1.0, -1.0,  0.0,  0.0, 1.0, 1.0, // top-left
            -1.0, -1.0, -1.0, -1.0,  0.0,  0.0, 0.0, 1.0, // bottom-left
            -1.0, -1.0, -1.0, -1.0,  0.0,  0.0, 0.0, 1.0, // bottom-left
            -1.0, -1.0,  1.0, -1.0,  0.0,  0.0, 0.0, 0.0, // bottom-right
            -1.0,  1.0,  1.0, -1.0,  0.0,  0.0, 1.0, 0.0, // top-right
            // right face
             1.0,  1.0,  1.0,  1.0,  0.0,  0.0, 1.0, 0.0, // top-left
             1.0, -1.0, -1.0,  1.0,  0.0,  0.0, 0.0, 1.0, // bottom-right
             1.0,  1.0, -1.0,  1.0,  0.0,  0.0, 1.0, 1.0, // top-right         
             1.0, -1.0, -1.0,  1.0,  0.0,  0.0, 0.0, 1.0, // bottom-right
             1.0,  1.0,  1.0,  1.0,  0.0,  0.0, 1.0, 0.0, // top-left
             1.0, -1.0,  1.0,  1.0,  0.0,  0.0, 0.0, 0.0, // bottom-left     
            // bottom face
            -1.0, -1.0, -1.0,  0.0, -1.0,  0.0, 0.0, 1.0, // top-right
             1.0, -1.0, -1.0,  0.0, -1.0,  0.0, 1.0, 1.0, // top-left
             1.0, -1.0,  1.0,  0.0, -1.0,  0.0, 1.0, 0.0, // bottom-left
             1.0, -1.0,  1.0,  0.0, -1.0,  0.0, 1.0, 0.0, // bottom-left
            -1.0, -1.0,  1.0,  0.0, -1.0,  0.0, 0.0, 0.0, // bottom-right
            -1.0, -1.0, -1.0,  0.0, -1.0,  0.0, 0.0, 1.0, // top-right
            // top face
            -1.0,  1.0, -1.0,  0.0,  1.0,  0.0, 0.0, 1.0, // top-left
             1.0,  1.0,  1.0,  0.0,  1.0,  0.0, 1.0, 0.0, // bottom-right
             1.0,  1.0, -1.0,  0.0,  1.0,  0.0, 1.0, 1.0, // top-right     
             1.0,  1.0,  1.0,  0.0,  1.0,  0.0, 1.0, 0.0, // bottom-right
            -1.0,  1.0, -1.0,  0.0,  1.0,  0.0, 0.0, 1.0, // top-left
            -1.0,  1.0,  1.0,  0.0,  1.0,  0.0, 0.0, 0.0  // bottom-left  
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

        // 使用实例化数组
        const modelArr: Array<number> = freeLights.reduce((acc: Array<number>, current: LightInfo) => {
            const currentModel: mat4 = mat4.create();
            mat4.translate(currentModel, currentModel, current.lightPos);
            mat4.scale(currentModel, currentModel, [0.09, 0.09, 0.09]);
            for (let i = 0, size = currentModel.length; i < size; i++) {
                acc.push(currentModel[i]);
            }
            return acc;
        }, []);

        const colorArr: Array<number> = freeLights.reduce((acc: Array<number>, current: LightInfo) => {
            for (let val of current.lightColor) {
                acc.push(val);
            }
            return acc;
        }, []);


        const modelVBO: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, modelVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelArr), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 0);

        gl.enableVertexAttribArray(5);
        gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 4 * Float32Array.BYTES_PER_ELEMENT);

        gl.enableVertexAttribArray(6);
        gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 8 * Float32Array.BYTES_PER_ELEMENT);

        gl.enableVertexAttribArray(7);
        gl.vertexAttribPointer(7, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 12 * Float32Array.BYTES_PER_ELEMENT);
        
        gl.vertexAttribDivisor(4, 1);
        gl.vertexAttribDivisor(5, 1);
        gl.vertexAttribDivisor(6, 1);
        gl.vertexAttribDivisor(7, 1);

        const colorVBO: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorArr), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(3, 1);

        gl.bindVertexArray(null);

    }
    gl.bindVertexArray(freeLightsVAO);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, freeLights.length);
    gl.bindVertexArray(null);
}



let fakeBuildingsVAO: WebGLVertexArrayObject;
function drawFakeBuildings(): void {
    if (!fakeBuildingsVAO) {
        fakeBuildingsVAO = gl.createVertexArray();
        gl.bindVertexArray(fakeBuildingsVAO);
        const vertexData: Float32Array = new Float32Array([
            // back face
            -1.0, 0.0, -1.0,  0.0,  0.0, -1.0, 0.0, 0.0, // bottom-left
             1.0,  2.0, -1.0,  0.0,  0.0, -1.0, 1.0, 1.0, // top-right
             1.0, 0.0, -1.0,  0.0,  0.0, -1.0, 1.0, 0.0, // bottom-right         
             1.0,  2.0, -1.0,  0.0,  0.0, -1.0, 1.0, 1.0, // top-right
            -1.0, 0.0, -1.0,  0.0,  0.0, -1.0, 0.0, 0.0, // bottom-left
            -1.0,  2.0, -1.0,  0.0,  0.0, -1.0, 0.0, 1.0, // top-left
            // front face
            -1.0, 0.0,  1.0,  0.0,  0.0,  1.0, 0.0, 0.0, // bottom-left
             1.0, 0.0,  1.0,  0.0,  0.0,  1.0, 1.0, 0.0, // bottom-right
             1.0,  2.0,  1.0,  0.0,  0.0,  1.0, 1.0, 1.0, // top-right
             1.0,  2.0,  1.0,  0.0,  0.0,  1.0, 1.0, 1.0, // top-right
            -1.0,  2.0,  1.0,  0.0,  0.0,  1.0, 0.0, 1.0, // top-left
            -1.0,  0.0,  1.0,  0.0,  0.0,  1.0, 0.0, 0.0, // bottom-left
            // left face
            -1.0,  2.0,  1.0, -1.0,  0.0,  0.0, 1.0, 0.0, // top-right
            -1.0,  2.0, -1.0, -1.0,  0.0,  0.0, 1.0, 1.0, // top-left
            -1.0,  0.0, -1.0, -1.0,  0.0,  0.0, 0.0, 1.0, // bottom-left
            -1.0,  0.0, -1.0, -1.0,  0.0,  0.0, 0.0, 1.0, // bottom-left
            -1.0, 0.0,  1.0, -1.0,  0.0,  0.0, 0.0, 0.0, // bottom-right
            -1.0,  2.0,  1.0, -1.0,  0.0,  0.0, 1.0, 0.0, // top-right
            // right face
             1.0,  2.0,  1.0,  1.0,  0.0,  0.0, 1.0, 0.0, // top-left
             1.0,  0.0, -1.0,  1.0,  0.0,  0.0, 0.0, 1.0, // bottom-right
             1.0,  2.0, -1.0,  1.0,  0.0,  0.0, 1.0, 1.0, // top-right         
             1.0,  0.0, -1.0,  1.0,  0.0,  0.0, 0.0, 1.0, // bottom-right
             1.0,  2.0,  1.0,  1.0,  0.0,  0.0, 1.0, 0.0, // top-left
             1.0,  0.0,  1.0,  1.0,  0.0,  0.0, 0.0, 0.0, // bottom-left     
            // bottom face
            -1.0,  0.0, -1.0,  0.0, -1.0,  0.0, 0.0, 1.0, // top-right
             1.0,  0.0, -1.0,  0.0, -1.0,  0.0, 1.0, 1.0, // top-left
             1.0,  0.0,  1.0,  0.0, -1.0,  0.0, 1.0, 0.0, // bottom-left
             1.0,  0.0,  1.0,  0.0, -1.0,  0.0, 1.0, 0.0, // bottom-left
            -1.0,  0.0,  1.0,  0.0, -1.0,  0.0, 0.0, 0.0, // bottom-right
            -1.0,  0.0, -1.0,  0.0, -1.0,  0.0, 0.0, 1.0, // top-right
            // top face
            -1.0,  2.0, -1.0,  0.0,  1.0,  0.0, 0.0, 1.0, // top-left
             1.0,  2.0,  1.0,  0.0,  1.0,  0.0, 1.0, 0.0, // bottom-right
             1.0,  2.0, -1.0,  0.0,  1.0,  0.0, 1.0, 1.0, // top-right     
             1.0,  2.0,  1.0,  0.0,  1.0,  0.0, 1.0, 0.0, // bottom-right
            -1.0,  2.0, -1.0,  0.0,  1.0,  0.0, 0.0, 1.0, // top-left
            -1.0,  2.0,  1.0,  0.0,  1.0,  0.0, 0.0, 0.0  // bottom-left  
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

        // 使用实例化数组
        const modelArr: Array<number> = buildingPoses.reduce((acc: Array<number>, current: mat4) => {
            for (let i = 0, size = current.length; i < size; i++) {
                acc.push(current[i]);
            }
            return acc;
        }, []);

        console.log('modelArr.slice(0, 16)', modelArr.slice(0, 16));


        const modelVBO: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, modelVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelArr), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 0);

        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 4 * Float32Array.BYTES_PER_ELEMENT);

        gl.enableVertexAttribArray(5);
        gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 8 * Float32Array.BYTES_PER_ELEMENT);

        gl.enableVertexAttribArray(6);
        gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 12 * Float32Array.BYTES_PER_ELEMENT);
        
        gl.vertexAttribDivisor(3, 1);
        gl.vertexAttribDivisor(4, 1);
        gl.vertexAttribDivisor(5, 1);
        gl.vertexAttribDivisor(6, 1);

        gl.bindVertexArray(null);

    }
    gl.bindVertexArray(fakeBuildingsVAO);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, buildingPoses.length);
    gl.bindVertexArray(null);
}



const looper = new RenderLooper(drawCB).start();

window.addEventListener('resize', function() {
    const { width, height } = resizeCvs2Screen(gl);
    camera.updateRatio(width / height);
}, false);

setInterval(function() {
    console.log('fps: ', looper.getFps());
}, 1000);