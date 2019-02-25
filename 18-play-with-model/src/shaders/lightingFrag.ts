const lightingFrag: string = `
    #version 300 es
    precision mediump float;
    uniform sampler2D posTex;
    uniform sampler2D diffuseTex;
    uniform sampler2D normalTex;
    uniform vec2 screenSize;
    uniform vec3 light_direction;

    uniform vec3 viewPos;
    out vec4 fragColor;
    void main() {
        vec2 texcoord = gl_FragCoord.xy / screenSize;
        vec3 worldPos = texture(posTex, texcoord).rgb;
        vec3 diffuse = texture(diffuseTex, texcoord).rgb;
        vec3 normal = texture(normalTex, texcoord).rgb;

        vec3 L = normalize(-light_direction);
        vec3 N = normalize(normal);
        // 漫反射系数
        float diff = max(dot(L, N), 0.0);
        vec3 lightColor = vec3(1.0, 1.0, 1.0);
        vec3 baseColor = vec3(0.3, 0.3, 0.3);
        float specularStrength = 0.0;
        if (diffuse.r < 0.1) {
            specularStrength = 0.5;
        }

        vec3 viewDir = normalize(viewPos - worldPos);
        vec3 reflectDir = reflect(-L, N);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        vec3 specular = specularStrength * spec * lightColor;

        vec3 ambientColor = vec3(0.15, 0.15, 0.15);
        vec3 diffuseColor = lightColor * baseColor * diff;

        fragColor = vec4(ambientColor + diffuseColor + specular, 1.0);
        // fragColor = vec4(lightColor, 1.0);
    }
`.trim();

export default lightingFrag;