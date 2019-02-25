import Shader from './shader';
import { TexType } from '../enums/index';

interface TextureItem {
    type: TexType;
    tex: WebGLTexture;
}

export default class Mesh {
    public vertices: Float32Array;
    public textures: Array<TextureItem>;
    public gl: WebGL2RenderingContext;
    private VAO: WebGLVertexArrayObject;
    private VBO: WebGLBuffer;
    constructor(gl: WebGL2RenderingContext, vertices: Float32Array, textures: Array<TextureItem>) {
        this.gl = gl;
        this.vertices = vertices;
        this.textures = textures;
        this.setupMesh();
    }

    setupMesh() {
        const gl: WebGL2RenderingContext = this.gl;
        this.VAO = gl.createVertexArray();
        this.VBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

        // 设置顶点数据
        gl.bindVertexArray(this.VAO);

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 6 * Float32Array.BYTES_PER_ELEMENT);

        gl.bindVertexArray(null);
    }

    draw(shader: Shader) {
        const gl = this.gl;
        let diffuse_index = 0;
        let specular_index = 0;
        shader.use();

        for (let i = 0; i < this.textures.length; i++) {
            if (this.textures[i].type === TexType.DIFFUSE) {
                shader.uniform1i(`DIFFUSE_TEXTURE${diffuse_index++}`, i);
            } else if (this.textures[i].type === TexType.SPECULAR) {
                shader.uniform1i(`SPECULAR_TEXTURE${specular_index++}`, i);
            }
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, this.textures[i].tex);
        };
        gl.bindVertexArray(this.VAO);
        // TODO: 暂时先这样，默认一个顶点数据块由8个浮点数组成
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 8);
        gl.bindVertexArray(null);
    }
}