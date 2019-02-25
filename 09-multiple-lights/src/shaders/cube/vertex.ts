const vertexSrc = `
    #version 300 es

    in vec3 aPos;
    in vec3 aNormal;
    in vec2 aTexCord;
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uPerspective;

    out vec3 vNormal;
    out vec3 vObjPos;
    out vec3 vFragPos;
    out vec2 vTexCord;

    void main() {
        vNormal = mat3(transpose(inverse(uModel))) * aNormal;
        vObjPos = aPos;
        vFragPos = vec3(uModel * vec4(aPos, 1.0));
        vTexCord = aTexCord;
        gl_Position = uPerspective * uView * uModel * vec4(aPos, 1.0);
    }
`.trim();

export default vertexSrc;