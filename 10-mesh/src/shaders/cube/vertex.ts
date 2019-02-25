const vertexSrc = `
    #version 300 es
    layout (location = 0) in vec3 aPos;
    layout (location = 1) in vec3 aNormal;
    layout (location = 2) in vec2 aTexCord;
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uPerspective;

    out vec3 vNormal;
    out vec3 vFragPos;
    out vec2 vTexCord;

    void main() {
        vNormal = mat3(transpose(inverse(uModel))) * aNormal;
        vFragPos = vec3(uModel * vec4(aPos, 1.0));
        vTexCord = aTexCord;
        gl_Position = uPerspective * uView * uModel * vec4(aPos, 1.0);
    }
`.trim();

export default vertexSrc;