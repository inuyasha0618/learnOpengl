import Mesh from './Mesh';
import Shader from './ShaderProgram';
import { mat4, glMatrix } from 'gl-matrix';
class Model {
    mesh: Mesh;
    modelMx: mat4;
    drawOutline: boolean;
    gl: WebGL2RenderingContext;
    constructor(gl: WebGL2RenderingContext, mesh: Mesh, modelMx: mat4, drawOutline: boolean = false) {
        this.gl = gl;
        this.mesh = mesh;
        this.modelMx = modelMx;
        this.drawOutline = drawOutline;
    }

    draw(originShader: Shader, borderShader?: Shader ): void {
        const gl = this.gl;
        originShader.use();
        originShader.uniformMatrix4fv('uModel', this.modelMx);
        gl.stencilFunc(gl.ALWAYS, 1, 0xff);
        gl.stencilMask(0xFF);
        this.mesh.draw(originShader);

        if (this.drawOutline && borderShader) {
            gl.stencilFunc(gl.NOTEQUAL, 1, 0xff);
            gl.stencilMask(0x00);
            gl.disable(gl.DEPTH_TEST);

            borderShader.use();
            const scale: number = 1.1;
            const borderModelMx: mat4 = mat4.create();
            mat4.scale(borderModelMx, this.modelMx, [scale, scale, scale]);
            borderShader.uniformMatrix4fv('uModel', borderModelMx);
            this.mesh.draw(borderShader);
            gl.stencilMask(0xFF);
            gl.enable(gl.DEPTH_TEST);
        }
    }
}

export default Model;