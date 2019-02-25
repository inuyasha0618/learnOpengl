const vertexSrc = `
    #version 300 es

    in vec3 aPos;
    in vec3 aNormal;
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uPerspective;

    out vec3 vNormal;
    out vec3 vFragPos;

    void main() {
        vNormal = mat3(transpose(inverse(uModel))) * aNormal;
        vFragPos = vec3(uModel * vec4(aPos, 1.0));
        gl_Position = uPerspective * uView * uModel * vec4(aPos, 1.0);
    }
`.trim();

export default vertexSrc;