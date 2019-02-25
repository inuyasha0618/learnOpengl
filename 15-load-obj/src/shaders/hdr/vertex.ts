const vertexSrc = `
    #version 300 es

    layout (location = 0) in vec3 aPos;
    layout (location = 1) in vec2 aTexcord;

    out vec2 vTexcord;

    void main() {
        vTexcord = aTexcord;
        gl_Position = vec4(aPos, 1.0);
    }

`.trim();

export default vertexSrc;