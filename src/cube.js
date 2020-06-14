import { perspective, transform, orthogonal } from './lib/matrix.js';
import { bindReset } from "./lib/reset.js";

const deg2rad = (angle) => Math.PI * angle / 180;

export default (canvas, compile, bindBuffer) => {
  const gl = canvas.getContext('webgl');
  const reset = bindReset(gl);

  // Vertex shader
  const vshader = `
  attribute vec4 position;
  attribute vec4 color;
  uniform mat4 camera;
  varying vec4 v_color;

  void main() {

    // Apply the camera matrix to the vertex position
    gl_Position = camera * position;

    // Set the varying color
    v_color = color;
  }`;

  // Fragment shader
  const fshader = `
  precision mediump float;
  varying vec4 v_color;

  void main() {
    gl_FragColor = v_color;
  }`;

  // Compile program
  const program = compile(gl, vshader, fshader);

  // Create a cube
  //
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  const verticesColors = new Float32Array([
    1.0,  1.0,  1.0,     1.0,  1.0,  1.0,  // v0 white
    -1.0,  1.0,  1.0,     1.0,  0.0,  1.0,  // v1 magenta
    -1.0, -1.0,  1.0,     1.0,  0.0,  0.0,  // v2 red
    1.0, -1.0,  1.0,     1.0,  1.0,  0.0,  // v3 yellow
    1.0, -1.0, -1.0,     0.0,  1.0,  0.0,  // v4 green
    1.0,  1.0, -1.0,     0.0,  1.0,  1.0,  // v5 cyan
    -1.0,  1.0, -1.0,     0.0,  0.0,  1.0,  // v6 blue
    -1.0, -1.0, -1.0,     0.0,  0.0,  0.0   // v7 black
  ]);

  // Indices of the vertices for each triangle
  const indices = new Uint8Array([
    0, 1, 2,   0, 2, 3,  // front
    0, 3, 4,   0, 4, 5,  // right
    0, 5, 6,   0, 6, 1,  // up
    1, 6, 7,   1, 7, 2,  // left
    7, 4, 3,   7, 3, 2,  // down
    4, 7, 6,   4, 6, 5   // back
  ]);

  // Number of vertices
  const n = 36;

  // Create a buffer object for vertices / colors
  const vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  // Create a buffer object for indexes
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  // Bytes per float (4)
  const { BYTES_PER_ELEMENT } = verticesColors;

  // Set attributes and uniforms
  const position = gl.getAttribLocation(program, 'position');
  gl.vertexAttribPointer(position, 3, gl.FLOAT, false, BYTES_PER_ELEMENT * 6, 0);
  gl.enableVertexAttribArray(position);

  const color = gl.getAttribLocation(program, 'color');
  gl.vertexAttribPointer(color, 3, gl.FLOAT, false, BYTES_PER_ELEMENT * 6, BYTES_PER_ELEMENT * 3);
  gl.enableVertexAttribArray(color);

  // Set the clear color and enable the depth test
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Set camera perspective and position
  const camera = gl.getUniformLocation(program, 'camera');
  // let cameraMatrix = perspective({fov: deg2rad(30), aspect: 1, near: 1, far: 100});
  let cameraMatrix = orthogonal({
    top: 5,
    right: 5,
    bottom: -5,
    left: -5,
    near: 1,
    far: 100
  });
  cameraMatrix = transform(cameraMatrix, {z: -5});

  let isRunning = true;
  let time = Date.now();
  // let drawStyle = gl.POINTS;
  // let drawStyle = gl.LINES;
  // let drawStyle = gl.LINE_STRIP;
  let drawStyle = gl.TRIANGLES;
  // let drawStyle = gl.TRIANGLE_STRIP;
  // let drawStyle = gl.TRIANGLE_FAN;

  const loop = () => {
    if (isRunning) {
      requestAnimationFrame(loop);
    }

    const now = Date.now();

    if (now - time > 3000) {
      time = now;
      drawStyle = drawStyle === gl.TRIANGLES ? gl.LINE_STRIP : gl.TRIANGLES;
    }

    cameraMatrix = transform(cameraMatrix, {rx: .004, ry: .004, rz: .004});
    gl.uniformMatrix4fv(camera, false, cameraMatrix);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(drawStyle, n, gl.UNSIGNED_BYTE, 0);
  };

  loop();

  return () => {
    reset();
    isRunning = false;
  };
};
