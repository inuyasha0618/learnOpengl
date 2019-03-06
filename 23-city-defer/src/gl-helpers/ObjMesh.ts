import Mesh from './Mesh';
import { fetchObjFile } from '../utils/index';
class ObjMesh extends Mesh {
    constructor(gl: WebGL2RenderingContext, url: string) {
        super();
        this.loadMesh(gl, url);
    }

    async loadMesh(gl: WebGL2RenderingContext, url: string) {
        const {vertPosArray, vertUVArray, vertNormArray, vertIndexArray} = await fetchObjFile(url);
        this.init(gl, vertPosArray, vertUVArray, vertNormArray, vertIndexArray);
    }

}

export default ObjMesh;