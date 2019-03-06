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
    float noise (in vec2 st, float t);

    void main() {
        mat4 processedModel = uModel;
        processedModel[3].xz = getPos(uId, processedModel[3].xz, uTime).xy;
        processedModel[3].y = noise(vec2(uId) * 0.1, uTime * 0.2) * 1.2 * processedModel[3].y;
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

    float random (in vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise (in vec2 st, float t) {
        st -= vec2(0.0, t);
        vec2 i = floor(st);
        vec2 f = fract(st);

        // Four corners in 2D of a tile
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        // Smooth Interpolation

        // Cubic Hermine Curve.  Same as SmoothStep()
        vec2 u = f*f*(3.0-2.0*f);
        // u = smoothstep(0.,1.,f);

        // Mix 4 coorners percentages
        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
    }
`.trim();

export default cubeVert;