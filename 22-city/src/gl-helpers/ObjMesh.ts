import Mesh from './Mesh';
import { fetchObjFile } from '../utils/index';
class ObjMesh extends Mesh {
    constructor(gl: WebGL2RenderingContext, url: string, instancedArr: Array<number> = []) {
        super();
        this.loadMesh(gl, url, instancedArr);
    }

    async loadMesh(gl: WebGL2RenderingContext, url: string, instancedArr: Array<number> = []) {
        const {vertPosArray, vertUVArray, vertNormArray, vertIndexArray} = await fetchObjFile(url);
        this.init(gl, vertPosArray, vertUVArray, vertNormArray, vertIndexArray, instancedArr);
    }

}

export default ObjMesh;