import createModelsFromOBJ from '../gl-helpers/obj-loader/createModelsFromOBJ';

const loadObjFile = async (url: string) => {
    const res = await window.fetch(url);
    const str: string = await res.text();
    console.time('load dragon');
    const objData = createModelsFromOBJ(str);
    console.timeEnd('load dragon');
    return objData;
}

export default loadObjFile;