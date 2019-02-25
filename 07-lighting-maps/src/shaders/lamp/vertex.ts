const vertexSrc = `
    #version 300 es

    in vec3 aPos;
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uPerspective;

    void main() {
        gl_Position = uPerspective * uView * uModel * vec4(aPos, 1.0);
    }
`.trim();

export default vertexSrc;