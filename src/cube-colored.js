import { compile } from "./lib/webgl.js";
import { perspective, transform, orthogonal } from "./lib/matrix.js";

// Convert deg in radians
const deg2rad = angle => Math.PI * angle / 180;

export default (canvas, compile, bindBuffer) => {
  // WebGL canvas context
  const gl = canvas.getContext('webgl');

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
  const vertices = new Float32Array([  // Vertex coordinates
    1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // front
    1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // right
    1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // down
    1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // back
  ]);

  const colors = new Float32Array([  // Colors
    0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0, // front (purple)
    0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4, // right (green)
    1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4, // up    (red)
    1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4, // left  (yellow)
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0, // down  (white)
    0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0  // back  (blue)
  ]);

  const indices = new Uint8Array([  // Indices
    0, 1, 2,   0, 2, 3,  // front
    4, 5, 6,   4, 6, 7,  // right
    8, 9, 10,  8, 10,11, // up
    12,13,14,  12,14,15, // left
    16,17,18,  16,18,19, // down
    20,21,22,  20,22,23  // back
  ]);

  const n = 36;

  // Set position and color
  bindBuffer(gl, vertices, program, 'position', 3, gl.FLOAT);
  bindBuffer(gl, colors, program, 'color', 3, gl.FLOAT);

  // Set indices
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  // Set the clear color and enable the depth test
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Set the camera
  const camera = gl.getUniformLocation(program, 'camera');
  // let cameraMatrix = perspective({fov: deg2rad(30), aspect: 1, near: 1, far: 100});
  let cameraMatrix = orthogonal({
    top: 5,
    right: 5,
    bottom: -5,
    left: -5,
    near: 1,
    far: 100,
  });
  cameraMatrix = transform(cameraMatrix, {z: -5});
  gl.uniformMatrix4fv(camera, false, cameraMatrix);

  let isRunning = true;

  // Animate
  const step = () => {
    if (isRunning) {
      requestAnimationFrame(step);
    }

    cameraMatrix = transform(cameraMatrix, {rx: .01, ry: .02, rz: .01});
    gl.uniformMatrix4fv(camera, false, cameraMatrix);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
  };

  step();

  return () => {
    isRunning = false;
  };
};
