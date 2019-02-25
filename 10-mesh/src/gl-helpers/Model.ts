import Mesh from './Mesh';
import Shader from './shader';
import { mat4 } from 'gl-matrix';
class Model {
    mesh: Mesh;
    modelMx: mat4;
    constructor(mesh: Mesh, modelMx: mat4) {
        this.mesh = mesh;
        this.modelMx = modelMx;
    }

    draw(shader: Shader): void {
        shader.use();
        shader.uniformMatrix4fv('uModel', this.modelMx);
        this.mesh.draw(shader);
    }
}

export default Model;