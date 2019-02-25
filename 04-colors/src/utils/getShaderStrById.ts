function getShaderStrById(id): string {
    const script: HTMLScriptElement = document.querySelector(id);
    return script.text.trim();
}

export default getShaderStrById;