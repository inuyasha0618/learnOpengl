const vertexSrc = `
    #version 300 es
    layout (location = 0) in vec3 aPos;
    layout (location = 1) in vec3 aNormal;
    layout (location = 2) in vec2 aTexCord;
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uPerspective;

    void main() {
        gl_Position = uPerspective * uView * uModel * vec4(aPos, 1.0);
    }
`.trim();

export default vertexSrc;