import { vec3, vec2 } from 'gl-matrix';
let sphereVAO: WebGLVertexArrayObject;
let indexCount: number;
function renderSphere(gl: WebGL2RenderingContext)
{
    if (!sphereVAO)
    {
        sphereVAO = gl.createVertexArray()

        const vbo: WebGLBuffer = gl.createBuffer();
        const ebo: WebGLBuffer = gl.createBuffer();

        const positions: Array<vec3> = [];
        const uv: Array<vec2> = [];
        const normals: Array<vec3> = [];
        const indices: Array<number> = [];

        const X_SEGMENTS: number = 64;
        const Y_SEGMENTS: number = 64;
        const PI: number = 3.14159265359;
        for (let y = 0; y <= Y_SEGMENTS; ++y)
        {
            for (let x = 0; x <= X_SEGMENTS; ++x)
            {
                const xSegment = x / X_SEGMENTS;
                const ySegment = y / Y_SEGMENTS;
                const xPos: number = Math.cos(xSegment * 2.0 * PI) * Math.sin(ySegment * PI);
                const yPos: number = Math.cos(ySegment * PI);
                const zPos: number = Math.sin(xSegment * 2.0 * PI) * Math.sin(ySegment * PI);

                positions.push(vec3.fromValues(xPos, yPos, zPos));
                uv.push(vec2.fromValues(xSegment, ySegment));
                normals.push(vec3.fromValues(xPos, yPos, zPos));
            }
        }

        let oddRow: boolean = false;
        for (let y = 0; y < Y_SEGMENTS; ++y)
        {
            if (!oddRow) // even rows: y == 0, y == 2; and so on
            {
                for (let x = 0; x <= X_SEGMENTS; ++x)
                {
                    indices.push(y       * (X_SEGMENTS + 1) + x);
                    indices.push((y + 1) * (X_SEGMENTS + 1) + x);
                }
            }
            else
            {
                for (let x = X_SEGMENTS; x >= 0; --x)
                {
                    indices.push((y + 1) * (X_SEGMENTS + 1) + x);
                    indices.push(y       * (X_SEGMENTS + 1) + x);
                }
            }
            oddRow = !oddRow;
        }
        indexCount = indices.length;

        // std::vector<float> data;
        const data: Array<number> = [];
        for (let i = 0; i < positions.length; ++i)
        {
            data.push(positions[i][0]);
            data.push(positions[i][1]);
            data.push(positions[i][2]);

            if (normals.length > 0)
            {
                data.push(normals[i][0]);
                data.push(normals[i][1]);
                data.push(normals[i][2]);
            }

            if (uv.length > 0)
            {
                data.push(uv[i][0]);
                data.push(uv[i][1]);
            }
        }
        gl.bindVertexArray(sphereVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 6 * Float32Array.BYTES_PER_ELEMENT);
    }

    gl.bindVertexArray(sphereVAO);
    gl.drawElements(gl.TRIANGLE_STRIP, indexCount, gl.UNSIGNED_INT, 0);
}

export default renderSphere;