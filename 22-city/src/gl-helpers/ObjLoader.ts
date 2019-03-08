import { vec3 } from 'gl-matrix';
interface objParseOutput {
    vertPosArray: Array<number>;
    vertUVArray: Array<number>;
    vertNormArray: Array<number>;
    vertIndexArray: Array<number>;
}

class ObjLoader {
    static parseObjText(objTxt: string): objParseOutput {
        console.time('model load cost: ');
        objTxt = objTxt.trim() + '\n';
        let posLineStart = 0;
        let posLineEnd = objTxt.indexOf('\n', 0);
        const rawVertPos: Array<number> = [];
        const rawVertUV: Array<number> = [];
        const rawVertNorm: Array<number> = [];

        const outputVertPos: Array<number> = [];
        const outputVertUV: Array<number> = [];
        const outputVertNorm: Array<number> = [];
        const outputIndexArr: Array<number> = [];
        let vertIndex: number = 0;

        const vertsCache: Object = {};
        while (posLineEnd > posLineStart) {
            const line: string = objTxt.substring(posLineStart, posLineEnd).trim();
            line;
            const lineSplitArr: Array<string> = line.split(/\s+/);
            const command: string = lineSplitArr.shift();
            switch(command) {
                // 顶点位置
                case 'v':
                    rawVertPos.push(parseFloat(lineSplitArr[0]), parseFloat(lineSplitArr[1]), parseFloat(lineSplitArr[2]));
                    break;
                // 顶点纹理坐标
                case 'vt':
                    rawVertUV.push(parseFloat(lineSplitArr[0]), parseFloat(lineSplitArr[1]));
                    break;
                // 顶点法向向量坐标
                case 'vn':
                    rawVertNorm.push(parseFloat(lineSplitArr[0]), parseFloat(lineSplitArr[1]), parseFloat(lineSplitArr[2]));
                    break;
                // 面
                case 'f':
                    const vertsPerFace: number = lineSplitArr.length;
                    // 下面计算该面的法向
                    const face_flat_normal: vec3 = vec3.create();
                    const hasNorm: boolean = !!lineSplitArr[0].split('/')[2];
                    const normProcessed: Object = {};

                    const rawVertNums: number = rawVertPos.length / 3;
                    const rawUvNums: number = rawVertUV.length / 2;
                    const rawNormNums: number = rawVertNorm.length / 3;

                    const isReverse: boolean = parseInt(lineSplitArr[0].split('/')[0]) < 0;

                    if (!hasNorm) {
                        // 说明没有法向
                        const point0_idx: number = isReverse ? rawVertNums + parseInt(lineSplitArr[0].split('/')[0]) : parseInt(lineSplitArr[0].split('/')[0]) - 1;
                        const point1_idx: number = isReverse ? rawVertNums + parseInt(lineSplitArr[1].split('/')[0]) : parseInt(lineSplitArr[1].split('/')[0]) - 1;
                        const point2_idx: number = isReverse ? rawVertNums + parseInt(lineSplitArr[2].split('/')[0]) : parseInt(lineSplitArr[2].split('/')[0]) - 1;

                        const point0: vec3 = vec3.fromValues(rawVertPos[3 * point0_idx], rawVertPos[3 * point0_idx + 1], rawVertPos[3 * point0_idx + 2]);
                        const point1: vec3 = vec3.fromValues(rawVertPos[3 * point1_idx], rawVertPos[3 * point1_idx + 1], rawVertPos[3 * point1_idx + 2]);
                        const point2: vec3 = vec3.fromValues(rawVertPos[3 * point2_idx], rawVertPos[3 * point2_idx + 1], rawVertPos[3 * point2_idx + 2]);

                        const edge1: vec3 = vec3.create();
                        vec3.subtract(edge1, point1, point0);

                        const edge2: vec3 = vec3.create();
                        vec3.subtract(edge2, point2, point0);

                        vec3.cross(face_flat_normal, edge1, edge2);
                        vec3.normalize(face_flat_normal, face_flat_normal);
                    }

                    for (let i = 1; i <= vertsPerFace - 2; i++) {
                        for (let j of [0, i, i + 1]) {
                            if (vertsCache.hasOwnProperty(lineSplitArr[j])) {
                                const currentVertIndex: number = vertsCache[lineSplitArr[j]];
                                outputIndexArr.push(currentVertIndex);

                                if (!hasNorm && !normProcessed[j]) {
                                    outputVertNorm[3 * currentVertIndex] += face_flat_normal[0];
                                    outputVertNorm[3 * currentVertIndex + 1] += face_flat_normal[1];
                                    outputVertNorm[3 * currentVertIndex + 2] += face_flat_normal[2];
                                    normProcessed[j] = true;
                                }
                            } else {
                                // 说明这是一个之前没遇到过的顶点
                                const currentVertIdxArr: Array<string> = lineSplitArr[j].split('/');

                                const posIndex: number = isReverse ? rawVertNums + parseInt(currentVertIdxArr[0]) : parseInt(currentVertIdxArr[0]) - 1;
                                outputVertPos.push(rawVertPos[3 * posIndex], rawVertPos[3 * posIndex + 1], rawVertPos[3 * posIndex + 2]);

                                if (currentVertIdxArr[1]) {
                                    const uvIndex: number = isReverse ? rawUvNums + parseInt(currentVertIdxArr[1]) : parseInt(currentVertIdxArr[1]) - 1;
                                    outputVertUV.push(rawVertUV[2 * uvIndex], rawVertUV[2 * uvIndex + 1]);
                                }

                                if (currentVertIdxArr[2]) {
                                    const normIndex: number = isReverse ? rawNormNums + parseInt(currentVertIdxArr[2]) : parseInt(currentVertIdxArr[2]) - 1;
                                    outputVertNorm.push(rawVertNorm[3 * normIndex], rawVertNorm[3 * normIndex + 1], rawVertNorm[3 * normIndex + 2]);
                                } else {
                                    outputVertNorm.push(face_flat_normal[0], face_flat_normal[1], face_flat_normal[2]);
                                    normProcessed[j] = true;
                                }

                                vertsCache[lineSplitArr[j]] = vertIndex;
                                outputIndexArr.push(vertIndex++);                                
                            }
                        }
                    }
                    break;
            }

            posLineStart = posLineEnd + 1;
            posLineEnd = objTxt.indexOf('\n', posLineStart + 1);
            // console.log(`posLineStart: ${posLineStart}, posLineEnd: ${posLineEnd}`);
        }

        console.timeEnd('model load cost: ');

        return {
            vertPosArray: outputVertPos,
            vertUVArray: outputVertUV,
            vertNormArray: outputVertNorm,
            vertIndexArray: outputIndexArr
        }
    }
}

export default ObjLoader;