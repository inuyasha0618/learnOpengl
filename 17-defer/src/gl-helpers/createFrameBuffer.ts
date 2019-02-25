function createFrameBuffer(gl: WebGL2RenderingContext, width: number, height: number, colorTexture: WebGLTexture, depthTexture: WebGLTexture): WebGLFramebuffer {
    let status: number;
    // Step 1: Create a frame buffer object
    const  frame_buffer: WebGLFramebuffer = gl.createFramebuffer();
  
    // Step 2: Create and initialize a texture buffer to hold the colors.
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
                                    gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
    // Step 3: Create and initialize a texture buffer to hold the depth values.
    // Note: the WEBGL_depth_texture extension is required for this to work
    //       and for the gl.DEPTH_COMPONENT texture format to be supported.
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, width, height, 0,
                                    gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
    // Step 4: Attach the specific buffers to the frame buffer.
    gl.bindFramebuffer(gl.FRAMEBUFFER, frame_buffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,  gl.TEXTURE_2D, depthTexture, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
  
    // Step 5: Verify that the frame buffer is valid.
    status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.log("The created frame buffer is invalid: " + status.toString());
    } else { console.log('success') } 
  
    // Unbind these new objects, which makes the default frame buffer the
    // target for rendering.
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  
    return frame_buffer;
}

export default createFrameBuffer;