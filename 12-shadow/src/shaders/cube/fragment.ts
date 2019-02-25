const fragmentSrc = `
    #version 300 es
    precision mediump float;

    struct Material {
        float shininess;
    };

    struct DirLight {
        vec3 ambient;
        vec3 diffuse;
        vec3 specular;
        vec3 direction;
    };

    struct PointLight {
        vec3 ambient;
        vec3 diffuse;
        vec3 specular;
        vec3 position;

        float constant;
        float linear;
        float quadratic;
    };

    struct SpotLight {
        vec3 ambient;
        vec3 diffuse;
        vec3 specular;
        vec3 position;
        vec3 direction;
        float cutOff;
        float outCutOff;

        float constant;
        float linear;
        float quadratic;
    };

    #define NUM_OF_POINTLIGHTS 1
    uniform vec3 uViewPos;
    uniform Material material;
    uniform sampler2D DIFFUSE_TEXTURE0;
    uniform sampler2D SPECULAR_TEXTURE0;
    uniform sampler2D SHADOW_TEXTURE;
    uniform mat4 shadowVp;
    uniform mat4 shadowV;
    uniform mat4 shadowP;
    uniform DirLight dirLight;
    uniform PointLight pointLights[NUM_OF_POINTLIGHTS];
    uniform SpotLight spotLight;

    uniform float far_plane;

    in vec3 vNormal;
    in vec3 vFragPos;
    in vec2 vTexCord;

    out vec4 fragColor;

    vec3 calcDirLight(DirLight light, Material material, vec3 normal, vec3 viewDir, vec2 texCord, float shadow);
    vec3 calcPointLight(PointLight light, Material material, vec3 normal, vec3 viewDir, vec2 texCord, vec3 fragPos, float shadow);
    vec3 calcSpotLight(SpotLight light, Material material, vec3 normal, vec3 viewDir, vec2 texCord, vec3 fragPos, float shadow);

    void main() {
        float shadow = 0.0;
        // 计算在光源下该片段的（裁剪）坐标
        vec3 norm = normalize(vNormal);
        vec3 lightDir = normalize(pointLights[0].position - vFragPos);
        // float bias = max(1.5 * (1.0 - dot(norm, lightDir)), 0.1); 
        // vec4 light_clip_cord = shadowP * (shadowV * vec4(vFragPos, 1.0) + vec4(0.0, 0.0, bias, 0.0));
        vec4 light_clip_cord = shadowP * shadowV * vec4(vFragPos, 1.0);
        vec4 light_ndc_cord = light_clip_cord.xyzw / light_clip_cord.w;
        // 归到0到1之间了
        vec3 light_depth_tex_cord = 0.5 * light_ndc_cord.xyz + 0.5;
        // float nearest_depth = texture(SHADOW_TEXTURE, light_depth_tex_cord.xy).r;
        float nearest_depth = (texture(SHADOW_TEXTURE, light_depth_tex_cord.xy).r) * far_plane;
        // shadow = light_depth_tex_cord.z <= nearest_depth ? 1.0 : 0.0;
        vec3 shadowLightDir = normalize(vec3(0.0, 50.0, 0.0) - vFragPos);
        float bias = max(1.8 * (1.0 - dot(norm, shadowLightDir)), 0.01); 
        // shadow = length(vFragPos - vec3(0.0, 50.0, 0.0)) - bias >= nearest_depth ? 1.0 : 0.0;
        float currentDepth = length(vFragPos - vec3(0.0, 50.0, 0.0));
        vec2 texelSize = vec2(1.0) / float(textureSize(SHADOW_TEXTURE, 0));
        for(int x = -1; x <= 1; ++x) {
            for(int y = -1; y <= 1; ++y) {
                float pcfDepth = texture(SHADOW_TEXTURE, light_depth_tex_cord.xy + vec2(x, y) * texelSize).r * far_plane; 
                shadow += currentDepth - bias > pcfDepth ? 1.0 : 0.0;        
            }    
        }
        shadow /= 9.0;

        vec3 viewDir = normalize(uViewPos - vFragPos);
        vec3 dirLightColor = calcDirLight(dirLight, material, vNormal, viewDir, vTexCord, shadow);
        vec3 pointLightColor = vec3(0.0, 0.0, 0.0);
        for (int i = 0; i < NUM_OF_POINTLIGHTS; i++) {
            pointLightColor += calcPointLight(pointLights[i], material, vNormal, viewDir, vTexCord, vFragPos, shadow);
        }
        
        vec3 spotLightColor = calcSpotLight(spotLight, material, vNormal, viewDir, vTexCord, vFragPos, shadow);

        fragColor = vec4((dirLightColor + pointLightColor + spotLightColor), 1.0);
    }

    vec3 calcDirLight(DirLight light, Material material, vec3 normal, vec3 viewDir, vec2 texCord, float shadow) {
        vec3 lightDir = normalize(-light.direction);
        vec3 norm = normalize(normal);
        vec3 reflectDir = normalize(reflect(-lightDir, norm));

        float diff = max(dot(lightDir, norm), 0.0);
        float spec = pow(max(dot(reflectDir, viewDir), 0.0), material.shininess);

        vec3 ambient = light.ambient * texture(DIFFUSE_TEXTURE0, texCord).rgb;
        vec3 diffuse = light.diffuse * texture(DIFFUSE_TEXTURE0, texCord).rgb * diff;
        vec3 specular = light.specular * texture(SPECULAR_TEXTURE0, texCord).rgb * spec;

        return ambient + (1.0 - shadow) * (diffuse + specular);
    }

    vec3 calcPointLight(PointLight light, Material material, vec3 normal, vec3 viewDir, vec2 texCord, vec3 fragPos, float shadow) {
        vec3 lightDir = normalize(light.position - fragPos);
        vec3 norm = normalize(normal);
        vec3 reflectDir = normalize(reflect(-lightDir, norm));

        float distance = length(light.position - fragPos);
        float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * distance * distance);

        float diff = max(dot(lightDir, norm), 0.0);
        float spec = pow(max(dot(reflectDir, viewDir), 0.0), material.shininess);

        vec3 ambient = light.ambient * texture(DIFFUSE_TEXTURE0, texCord).rgb * attenuation;
        vec3 diffuse = light.diffuse * texture(DIFFUSE_TEXTURE0, texCord).rgb * diff * attenuation;
        vec3 specular = light.specular * texture(SPECULAR_TEXTURE0, texCord).rgb * spec * attenuation;

        return ambient + (1.0 - shadow) * (diffuse + specular);
    }

    vec3 calcSpotLight(SpotLight light, Material material, vec3 normal, vec3 viewDir, vec2 texCord, vec3 fragPos, float shadow) {
        vec3 fragDir = normalize(fragPos - light.position);

        float distance = length(light.position - fragPos);
        float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * distance * distance);
        vec3 lightDir = normalize(light.position - fragPos);
        float theta = dot(-lightDir, normalize(light.direction));
        float intensity = clamp((theta - light.outCutOff) / (light.cutOff - light.outCutOff), 0.0, 1.0);

        vec3 norm = normalize(normal);
        vec3 reflectDir = normalize(reflect(-lightDir, norm));

        float diff = max(dot(lightDir, norm), 0.0);
        float spec = pow(max(dot(reflectDir, viewDir), 0.0), material.shininess);

        vec3 ambient = light.ambient * vec3(texture(DIFFUSE_TEXTURE0, vTexCord)) * attenuation;
        vec3 diffuse = light.diffuse * vec3(texture(DIFFUSE_TEXTURE0, vTexCord)) * diff * attenuation * intensity;
        vec3 specular = light.specular * vec3(texture(SPECULAR_TEXTURE0, vTexCord)) * spec * attenuation * intensity;
        return ambient + (1.0 - shadow) * (diffuse + specular);
    }
`.trim();

export default fragmentSrc;