const texLoader = url => {
    const image: HTMLImageElement = new Image();
    image.src = url
    return new Promise((resolve, reject) => {
        image.onload = () => {
            resolve(image);
        };
        image.onerror = reject;
    })
}

export default texLoader;