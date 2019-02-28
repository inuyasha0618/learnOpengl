import ObjLoader from '../gl-helpers/ObjLoader';
const fetchObjFile = async (url: string) => {
    const res = await window.fetch(url);
    const objTxt: string = await res.text();
    return ObjLoader.parseObjText(objTxt);   
}

export default fetchObjFile;