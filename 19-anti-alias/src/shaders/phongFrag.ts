const phongFragSrc: string = `
    #version 300 es
    precision mediump float;
    uniform vec3 light_direction;
    uniform vec3 viewPos;
    uniform sampler2D tex;
    uniform float yOffset;
    uniform float opacity;
    in vec3 vPosWorld;
    in vec3 vNormal;
    in vec2 vTexcord;
    out vec4 fragColor;
    void main() {
        vec3 L = normalize(-light_direction);
        vec3 N = normalize(vNormal);
        // 漫反射系数
        float diff = max(dot(L, N), 0.0);
        vec3 lightColor = vec3(1.0, 1.0, 1.0);
        vec3 baseColor = vec3(0.3, 0.3, 0.3);
        float specularStrength = 0.0;
        vec3 specularValue = texture(tex, vTexcord + vec2(0.0, yOffset)).rgb;
        if (specularValue.r < 0.1) {
            specularStrength = 0.5;
        }

        vec3 viewDir = normalize(viewPos - vPosWorld);
        vec3 reflectDir = reflect(-L, N);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        vec3 specular = specularStrength * spec * lightColor;

        vec3 ambientColor = vec3(0.15, 0.15, 0.15);
        vec3 diffuseColor = lightColor * baseColor * diff;

        fragColor = vec4(ambientColor + diffuseColor + specular, opacity);
    }
`.trim();
export default phongFragSrc;