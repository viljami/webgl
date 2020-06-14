import sky from '../assets/sky.jpg';
import { bindReset } from "./lib/reset.js";

export default (canvas, compile, bindBuffer) => {
  const gl = canvas.getContext("webgl");
  const reset = bindReset(gl);

  // Vertex shader
  const vshader = `
  attribute vec4 position;
  attribute vec2 texCoord;
  varying vec2 v_texCoord;

  void main() {
    gl_Position = position;
    v_texCoord = texCoord;
  }`;

  // Fragment shader
  const fshader = `
  precision mediump float;
  uniform sampler2D sampler;
  varying vec2 v_texCoord;

  void main() {
    gl_FragColor = texture2D(sampler, v_texCoord);
  }`;

  // Compile program
  const program = compile(gl, vshader, fshader);

  // Interleaved data buffer (X,Y: vertex coordinates, U,V: texture coordinates)
  // Texture coordinates are also sometimes called S and T
  const verticesTexCoords = new Float32Array([
    -0.5,
    0.5,
    0.0,
    1.0,

    -0.5,
    -0.5,
    0.0,
    0.0,

    0.5,
    0.5,
    1.0,
    1.0,

    0.5,
    -0.5,
    1.0,
    0.0,
  ]);

  const n = 4; // vertices (4)
  const { BYTES_PER_ELEMENT } = verticesTexCoords; // bytes per float (4)

  // Create the buffer object
  const vertexTexCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

  // Use every 1st and 2nd float for position
  const position = gl.getAttribLocation(program, "position");
  gl.vertexAttribPointer(
    position,
    2,
    gl.FLOAT,
    false,
    BYTES_PER_ELEMENT * 4,
    0
  );
  gl.enableVertexAttribArray(position);

  // Use every 3rd and 4th float for texCoord
  const texCoord = gl.getAttribLocation(program, "texCoord");
  gl.vertexAttribPointer(
    texCoord,
    2,
    gl.FLOAT,
    false,
    BYTES_PER_ELEMENT * 4,
    BYTES_PER_ELEMENT * 2
  );
  gl.enableVertexAttribArray(texCoord);

  // Set the clear color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Set a 2D texture
  const image = new Image();
  const texture = gl.createTexture();
  const sampler = gl.getUniformLocation(program, "sampler");

  let isRunning = true;
  let angle = 0.0;

  const step = () => {
    if (isRunning) {
      requestAnimationFrame(step);
    }

    angle += 0.01;
    verticesTexCoords[0] += Math.cos(angle) * 0.01;
    verticesTexCoords[5] += Math.cos(angle) * 0.01;
    verticesTexCoords[10] += Math.sin(angle) * 0.01;
    verticesTexCoords[15] += Math.sin(angle) * 0.01;
    gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.clear(gl.COLOR_BUFFER_BIT); // Clear canvas
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the quad
  };


  image.onload = function () {
    // Flip the image's y axis
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    // Enable texture 0
    gl.activeTexture(gl.TEXTURE0);

    // Set the texture's target (2D or cubemap)
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Stretch/wrap options
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    // Bind image to texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Pass texture 0 to the sampler
    gl.uniform1i(sampler, 0);

    gl.clear(gl.COLOR_BUFFER_BIT); // Clear canvas
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the quad

    step();
  };
  image.src = sky; // URL or path relative to the HTML file

  return () => {
    reset();
    isRunning = false;
  };
};
