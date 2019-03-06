const cubeVert: string = `
    #version 300 es
    layout (location = 0) in vec3 aPos;
    layout (location = 1) in vec3 aNormal;
    layout (location = 2) in vec2 aTexcord;
    out vec3 vPosWorld;
    out vec3 vNormal;
    out vec2 vTexcord;
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uPerspective;
    uniform float uTime;
    uniform ivec2 uId;

    float N21(vec2 p);
    vec2 N22(vec2 p);
    vec2 getPos(ivec2 id, vec2 offset, float iTime);

    void main() {
        mat4 processedModel = uModel;
        processedModel[3].xz = getPos(uId, processedModel[3].xz, uTime).xy;
        vPosWorld = (processedModel * vec4(aPos, 1.0)).xyz;
        vNormal = (transpose(inverse(uModel)) * vec4(aNormal, 1.0)).xyz;
        vTexcord = aTexcord;
        gl_Position = uPerspective * uView * vec4(vPosWorld, 1.0);
    }

    float N21(vec2 p) {
        p = fract(p * vec2(233.34, 851.73));
        p += dot(p, p + 23.45);
        return fract(p.x * p.y);
    }
    
    vec2 N22(vec2 p) {
        float n = N21(p);
        return vec2(n, N21(p + n));
    }
    
    vec2 getPos(ivec2 id, vec2 offset, float iTime) {
        vec2 n = N22(float(id) + offset);
        float x = cos(3.0 * iTime * n.x);
        float y = sin(1.5 * iTime * n.y);
        return vec2(x, y) * 1.4 + offset;
    }
`.trim();

export default cubeVert;