import { bindReset } from "./lib/reset.js";

export default (canvas, compile, bindBuffer) => {
  const gl = canvas.getContext("webgl");
  const reset = bindReset(gl);

  const vertexShader = `
attribute vec4 position;
attribute vec4 color;
varying vec4 v_color;

void main() {
  gl_Position = position;
  v_color = color;
}`;

  // Fragment shader
  var fragmentShader = `
precision mediump float;
varying vec4 v_color;

// gl_FragCoords, where the fragment is positioned on the window
// gl_FragCoord = { x, y, z, w }

void main() {
  gl_FragColor = v_color;
}`;

  const program = compile(gl, vertexShader, fragmentShader);

  // Define vertices and colors
  var verticesColors = new Float32Array([
    // x,  y,   z,   r,   g,   b
    1.0,
    1.0,
    0.0,
    0.0,
    1.0,
    0.0,
    -1.0,
    -1.0,
    0.0,
    0.0,
    0.0,
    1.0,
    1.0,
    -1.0,
    0.0,
    1.0,
    0.0,
    0.0,
    -1.0,
    1.0,
    0.0,
    0.0,
    1.0,
    0.0,
    -1.0,
    -1.0,
    0.0,
    0.0,
    0.0,
    1.0,
    1.0,
    1.0,
    0.0,
    0.0,
    1.0,
    0.0,
  ]);

  // Save the number of vertices (3)
  const n = 6;

  // Get the size of each float in bytes (4)
  const { BYTES_PER_ELEMENT } = verticesColors;

  // Create a buffer object
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  // Bind the attribute position to the 1st, 2nd and 3rd floats in every chunk of 6 floats in the buffer
  const position = gl.getAttribLocation(program, "position");
  gl.vertexAttribPointer(
    position, // target
    3, // interleaved data size
    gl.FLOAT, // type
    false, // normalize
    BYTES_PER_ELEMENT * 6, // stride (chunk size)
    0 // offset (position of interleaved data in chunk)
  );
  gl.enableVertexAttribArray(position);

  // Bind the attribute color to the 3rd, 4th and 5th float in every chunk
  const color = gl.getAttribLocation(program, "color");
  gl.vertexAttribPointer(
    color, // target
    3, // interleaved chunk size
    gl.FLOAT, // type
    false, // normalize
    BYTES_PER_ELEMENT * 6, // stride
    BYTES_PER_ELEMENT * 3 // offset
  );
  gl.enableVertexAttribArray(color);

  // Set the clear color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  let mouse = { x: 0.0, y: 0.0 };
  canvas.addEventListener("mousemove", ({ clientX, clientY }) => {
    mouse.x = clientX;
    mouse.y = clientY;
  });

  let isRunning = true;

  const loop = () => {
    if (isRunning) {
      requestAnimationFrame(loop);
    }

    const ratio1 = mouse.x / window.innerWidth;
    const ratio2 = mouse.y / window.innerHeight;
    verticesColors[6 * 0 + 3] = ratio1;
    // verticesColors[6 * 1 + 4] = ratio1 / ratio2;
    verticesColors[6 * 2 + 5] = ratio2;

    verticesColors[6 * 5 + 3] = ratio1;
    // verticesColors[6 * 4 + 4] = ratio1 / ratio2;
    verticesColors[6 * 3 + 5] = ratio2;

    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Render
    gl.drawArrays(gl.TRIANGLES, 0, n);
  };

  loop();

  return () => {
    reset();
    isRunning = false;
  };
};
