import createModelsFromOBJ from '../gl-helpers/obj-loader/createModelsFromOBJ';

const loadObjFile = async (url: string) => {
    const res = await window.fetch(url);
    const str: string = await res.text();
    console.time('load dragon');
    const { vertex_pos_data, output_smooth_normals, normalLineData } = createModelsFromOBJ(str);
    console.timeEnd('load dragon');
    return { vertex_pos_data, output_smooth_normals, normalLineData };
}

export default loadObjFile;