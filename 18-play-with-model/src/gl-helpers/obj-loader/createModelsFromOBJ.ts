import ObjTextParser from './ObjTextParser';
import { vec3, mat4 } from 'gl-matrix';

interface Output {
    vertex_pos_data: Float32Array,
    output_smooth_normals: Float32Array,
    normalLineData: Float32Array,
    vertex_uv_data: Float32Array
}

// TODO: 先不带mtl文件解析试试
// TODO: 返回值类型需要重新制定, 用interface
function createModelsFromOBJ(model_description: string): Output {
    const lines: Array<string> = model_description.split('\n');
    const textParser: ObjTextParser = new ObjTextParser();

    // Count the number of each type of data value.
    const number_vertices: number       = (model_description.match(/\nv /g)||[]).length;
    const number_normals: number        = (model_description.match(/\nvn /g)||[]).length;
    const number_texcords: number = (model_description.match(/\nvt /g)||[]).length;
    const number_faces: number = (model_description.match(/\nf /g) || []).length;

    const all_vertices: Float32Array = new Float32Array(3 * number_vertices);
    const all_texcords: Float32Array = new Float32Array(2 * number_texcords);
    const all_normals: Float32Array = new Float32Array(3 * number_normals);

    // TODO: 首先获得（只一次）模型每个面的顶点数
    const number_vertexes_per_face: number = (model_description + '').match(/\nf [^\n]+/)[0].split(/ +/).length - 1;
    const number_triangles_per_face: number = number_vertexes_per_face - 2;
    // TODO: 最终合并到这个数组中
    const vertex_counts: number = number_faces * number_triangles_per_face * 3
    const vertex_pos_data: Float32Array = new Float32Array(vertex_counts * 3);
    const vertex_uv_data: Float32Array = new Float32Array(vertex_counts * 2);
    // 顶点在全局all_vertices中的索引
    const vertex_pos_index: Float32Array = new Float32Array(vertex_counts);
    // 顶点在全局all_normals中的索引
    const vertex_normal_index: Float32Array = new Float32Array(vertex_counts);

    // 当前处理的vertex_pos_data的索引
    let current_vertex_pos_data_idx: number = 0;

    // 当前顶点的索引
    let vertex_index: number = 0;
    // 当前法线的索引
    let normal_index: number = 0;
    // 当前贴图坐标的索引
    let texcord_index: number = 0;

    // 当前处理的face的序号
    let curr_face_idx = 0;

    let hasNormal: boolean = false;

    const all_flat_normals: Array<vec3> = new Array(number_faces);
    const flat_normal_indexes: Int32Array = new Int32Array(vertex_counts);
    const normalProcessed: Array<Array<number>> = new Array(all_vertices.length);
    // const all_avg_normals: Array<vec3> = new Array(all_vertices.length);
    const all_avg_normals: Float32Array = new Float32Array(all_vertices.length * 3);
    const output_smooth_normals: Float32Array = new Float32Array(vertex_counts * 3);

    function _calcuNormals(): void {
        if (number_normals <= 0) {
            for (let i: number = 0; i < vertex_counts; i++) {
                // 当前顶点在all_vertices中的索引值
                const curr_index_in_all_vertices: number = vertex_pos_index[i];
                normalProcessed[curr_index_in_all_vertices] = normalProcessed[curr_index_in_all_vertices] || [];
                const curr_flat_normal_index: number = flat_normal_indexes[i];
                const curr_flat_normal: vec3 = all_flat_normals[curr_flat_normal_index];
                    
                if (!normalProcessed[curr_index_in_all_vertices].includes(curr_flat_normal_index)) {
                    normalProcessed[curr_index_in_all_vertices].push(curr_flat_normal_index);
                    // vec3.add(all_avg_normals[curr_index_in_all_vertices], all_avg_normals[curr_index_in_all_vertices], curr_flat_normal);
                    all_avg_normals[curr_index_in_all_vertices * 3] += curr_flat_normal[0];
                    all_avg_normals[curr_index_in_all_vertices * 3 + 1] += curr_flat_normal[1];
                    all_avg_normals[curr_index_in_all_vertices * 3 + 2] += curr_flat_normal[2];
                }
            }
    
            // all_vertices对应的all_avg_normals计算完毕，然后再便利一次，根据索引，将数据输出到output_smooth_normals中
            for (let j = 0; j < vertex_counts; j++) {
                const curr_index_in_all_vertices: number = vertex_pos_index[j];
                const curr_smooth_normal: vec3 = vec3.fromValues(
                    all_avg_normals[curr_index_in_all_vertices * 3],
                    all_avg_normals[curr_index_in_all_vertices * 3 + 1],
                    all_avg_normals[curr_index_in_all_vertices * 3 + 2],
                );
                vec3.normalize(curr_smooth_normal, curr_smooth_normal);
                output_smooth_normals[j * 3] = curr_smooth_normal[0];
                output_smooth_normals[j * 3 + 1] = curr_smooth_normal[1];
                output_smooth_normals[j * 3 + 2] = curr_smooth_normal[2];
            }
        } else {
            for (let j = 0; j < vertex_counts; j++) {
                const curr_index_in_all_normals: number = vertex_normal_index[j];
                const curr_index_in_all_vertices: number = vertex_pos_index[j];

                all_avg_normals[curr_index_in_all_vertices * 3] = all_normals[curr_index_in_all_normals * 3];
                all_avg_normals[curr_index_in_all_vertices * 3 + 1] = all_normals[curr_index_in_all_normals * 3 + 1];
                all_avg_normals[curr_index_in_all_vertices * 3 + 2] = all_normals[curr_index_in_all_normals * 3 + 2];

                const curr_smooth_normal: vec3 = vec3.fromValues(
                    all_normals[curr_index_in_all_normals * 3],
                    all_normals[curr_index_in_all_normals * 3 + 1],
                    all_normals[curr_index_in_all_normals * 3 + 2]
                );
                vec3.normalize(curr_smooth_normal, curr_smooth_normal);
                output_smooth_normals[j * 3] = curr_smooth_normal[0];
                output_smooth_normals[j * 3 + 1] = curr_smooth_normal[1];
                output_smooth_normals[j * 3 + 2] = curr_smooth_normal[2];
            }
        }
    }

    function _parseFaces(): void {
        // TODO: 根据face信息将所有的顶点坐标，法向方向，及贴图坐标
        // 整合成为一个大型的顶点数组（里面的顶点是有重复的， 为了快速渲染，同时使用gl.drawArrays()）
        let n: number = 1;
        const index_list: Array<Array<number>> = [];
        const vertex_indexes: Array<number> = [];
        while (textParser.parseIndexes(vertex_indexes)) {
            index_list.push(vertex_indexes.slice());
        }
        while (n <= number_triangles_per_face) {
            // 找到该face顶点0顶点坐标索引
            const vertex_0_index: number = index_list[0][0] - 1;
            const vertex_1_index: number = index_list[n][0] - 1;
            const vertex_2_index: number = index_list[n + 1][0] - 1;

            // 顶点的贴图的索引
            const vertex_0_tex_index: number = index_list[0][1] - 1
            const vertex_1_tex_index: number = index_list[n][1] - 1
            const vertex_2_tex_index: number = index_list[n + 1][1] - 1

            // 顶点的法向的索引
            const vertex_0_normal_index: number = index_list[0][2] - 1;
            const vertex_1_normal_index: number = index_list[n][2] - 1;
            const vertex_2_normal_index: number = index_list[n + 1][2] - 1;

            let point0_x: number;
            let point0_y: number;
            let point0_z: number;

            let point1_x: number;
            let point1_y: number;
            let point1_z: number;

            let point2_x: number;
            let point2_y: number;
            let point2_z: number;
            
            // 根据这些索引找到真正的位置数据，并更新到vertexData中
            // 一个三角面能更新3个点的信息，一个点是三个数据
            vertex_pos_index[current_vertex_pos_data_idx] = vertex_0_index;
            vertex_normal_index[current_vertex_pos_data_idx] = vertex_0_normal_index;
            point0_x = vertex_pos_data[3 * current_vertex_pos_data_idx] = all_vertices[vertex_0_index * 3];
            point0_y = vertex_pos_data[3 * current_vertex_pos_data_idx + 1] = all_vertices[vertex_0_index * 3 + 1];
            point0_z = vertex_pos_data[3 * current_vertex_pos_data_idx + 2] = all_vertices[vertex_0_index * 3 + 2];

            vertex_uv_data[2 * current_vertex_pos_data_idx] = all_texcords[vertex_0_tex_index * 2];
            vertex_uv_data[2 * current_vertex_pos_data_idx + 1] = all_texcords[vertex_0_tex_index * 2 + 1];
            current_vertex_pos_data_idx += 1;


            vertex_pos_index[current_vertex_pos_data_idx] = vertex_1_index;
            vertex_normal_index[current_vertex_pos_data_idx] = vertex_1_normal_index;
            point1_x = vertex_pos_data[3 * current_vertex_pos_data_idx] = all_vertices[vertex_1_index * 3];
            point1_y = vertex_pos_data[3 * current_vertex_pos_data_idx + 1] = all_vertices[vertex_1_index * 3 + 1];
            point1_z = vertex_pos_data[3 * current_vertex_pos_data_idx + 2] = all_vertices[vertex_1_index * 3 + 2];

            vertex_uv_data[2 * current_vertex_pos_data_idx] = all_texcords[vertex_1_tex_index * 2];
            vertex_uv_data[2 * current_vertex_pos_data_idx + 1] = all_texcords[vertex_1_tex_index * 2 + 1];
            current_vertex_pos_data_idx += 1;

            vertex_pos_index[current_vertex_pos_data_idx] = vertex_2_index;
            vertex_normal_index[current_vertex_pos_data_idx] = vertex_2_normal_index;
            point2_x = vertex_pos_data[3 * current_vertex_pos_data_idx] = all_vertices[vertex_2_index * 3];
            point2_y = vertex_pos_data[3 * current_vertex_pos_data_idx + 1] = all_vertices[vertex_2_index * 3 + 1];
            point2_z = vertex_pos_data[3 * current_vertex_pos_data_idx + 2] = all_vertices[vertex_2_index * 3 + 2];
            vertex_uv_data[2 * current_vertex_pos_data_idx] = all_texcords[vertex_2_tex_index * 2];
            vertex_uv_data[2 * current_vertex_pos_data_idx + 1] = all_texcords[vertex_2_tex_index * 2 + 1];
            current_vertex_pos_data_idx += 1;

            // TODO: 根据法向索引更新顶点法向
            if (index_list[0][2] === -1) {
                // 说明obj文件没有提供法向信息
                // TODO: 需首先计算出三角面的法向信息，然后再根据三角面的法向方向平均出一个smooth_normal
                if (n === 1) {
                    const edge1: vec3 = vec3.fromValues(point1_x - point0_x, point1_y - point0_y, point1_z - point0_z);
                    const edge2: vec3 = vec3.fromValues(point2_x - point1_x, point2_y - point1_y, point2_z - point1_z);
                    const flat_normal: vec3 = vec3.create();
                    vec3.cross(flat_normal, edge1, edge2);
                    vec3.normalize(flat_normal, flat_normal);
                    all_flat_normals[curr_face_idx] = flat_normal;
                }
                flat_normal_indexes[current_vertex_pos_data_idx - 3] = curr_face_idx;
                flat_normal_indexes[current_vertex_pos_data_idx - 2] = curr_face_idx;
                flat_normal_indexes[current_vertex_pos_data_idx - 1] = curr_face_idx;
            } else {
                // 有法向信息用文件中的法向，什么都不用做
            }

            n += 1;
        }
        curr_face_idx++;
    }
    for (let line_number: number = 0, len: number = lines.length; line_number < len; line_number++) {
        textParser.init(lines[line_number]);
        // 每行开头都是一个命令词
        const command: string = textParser.getWord();
        if (!command) continue;
        switch (command) {
            case '#':
                // 跳过注释
                break;
            case 'mtllib':
                // TODO: 后面再处理材质文件相关内容
                break;
            case 'usemtl':
                // TODO: 后面再处理
                break;
            case 'o':
            case 'g':
                // TODO: 模型块
                break;
            case 'v':
                all_vertices[vertex_index * 3] = textParser.getFloat();
                all_vertices[vertex_index * 3 + 1] = textParser.getFloat();
                all_vertices[vertex_index * 3 + 2] = textParser.getFloat();
                vertex_index += 1;
                break;
            case 'vn':
                hasNormal = true;
                all_normals[normal_index * 3] = textParser.getFloat();
                all_normals[normal_index * 3 + 1] = textParser.getFloat();
                all_normals[normal_index * 3 + 2] = textParser.getFloat();
                normal_index += 1;
                break;
            case 'vt':
                all_texcords[texcord_index * 2] = textParser.getFloat();
                all_texcords[texcord_index * 2 + 1] = textParser.getFloat();
                texcord_index += 1;
                break;
            case 'f':
                _parseFaces();
                break;
        }
    }

    _calcuNormals();

    // 输出供调试绘制法线使用的线段数据
    const normalLineData: Float32Array = new Float32Array(all_vertices.length * 2);
    const vec_len: number = 0.001;
    for (let i = 0, size = all_vertices.length; i < size; i++) {
        const curr_normal: vec3 = number_normals <= 0
        ? vec3.fromValues(
            all_avg_normals[i * 3],
            all_avg_normals[i * 3 + 1],
            all_avg_normals[i * 3 + 2],
        ) : vec3.fromValues(
            all_avg_normals[i * 3],
            all_avg_normals[i * 3 + 1],
            all_avg_normals[i * 3 + 2],
        );
        vec3.normalize(curr_normal, curr_normal);

        normalLineData[6 * i] = all_vertices[3 * i];
        normalLineData[6 * i + 1] = all_vertices[3 * i + 1];
        normalLineData[6 * i + 2] = all_vertices[3 * i + 2];
        
        normalLineData[6 * i + 3] = all_vertices[3 * i] + vec_len * curr_normal[0];
        normalLineData[6 * i + 4] = all_vertices[3 * i + 1] + vec_len * curr_normal[1];
        normalLineData[6 * i + 5] = all_vertices[3 * i + 2] + vec_len * curr_normal[2];
    }

    return { vertex_pos_data, output_smooth_normals, normalLineData, vertex_uv_data };
}

export default createModelsFromOBJ;