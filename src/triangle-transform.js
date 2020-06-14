import { bindReset } from "./lib/reset.js";

export default (canvas, compile, bindBuffer) => {
  const gl = canvas.getContext("webgl");
  const reset = bindReset(gl);

  // Vertex shader
  const vshader = `
  attribute vec4 position;
  uniform mat4 translation;
  uniform mat4 rotation;
  uniform mat4 scale;
  void main() {
    // Translation, then rotation, then scale
    gl_Position = (scale * (rotation * translation)) * position;
  }`;

  // Fragment shader
  const fshader = `
  precision mediump float;
  uniform vec4 color;
  void main() {
    gl_FragColor = color;
  }`;

  // Compile program
  const program = compile(gl, vshader, fshader);

  // Get shaders attributes and uniforms
  const color = gl.getUniformLocation(program, "color");
  const translation = gl.getUniformLocation(program, "translation");
  const rotation = gl.getUniformLocation(program, "rotation");
  const scale = gl.getUniformLocation(program, "scale");

  // Set color
  gl.uniform4f(color, 1.0, 0.0, 0.0, 1.0);

  // Set position
  const vertices = new Float32Array([0, 0.5, -0.5, -0.5, 0.5, -0.5]);
  const buffer = bindBuffer(gl, vertices, program, "position", 2, gl.FLOAT);

  // Set translation matrix (transposed)
  const Tx = 0.0;
  const Ty = 0.0;
  const t_matrix = new Float32Array([
    1.0,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
    0.0,
    Tx,
    Ty,
    0.0,
    1.0,
  ]);
  gl.uniformMatrix4fv(translation, false, t_matrix);

  const translate = (Tx, Ty) => {
    t_matrix[12] = Tx;
    t_matrix[13] = Ty;
    gl.uniformMatrix4fv(translation, false, t_matrix);
  };

  // Set rotation matrix (transposed)
  var B = 0.0;
  var cosB = Math.cos(B);
  var sinB = Math.sin(B);
  var r_matrix = new Float32Array([
    cosB,
    sinB,
    0.0,
    0.0,
    -sinB,
    cosB,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
  ]);
  gl.uniformMatrix4fv(rotation, false, r_matrix);

  const rotate = (B) => {
    var cosB = Math.cos(B);
    var sinB = Math.sin(B);
    r_matrix[0] = cosB;
    r_matrix[1] = sinB;
    r_matrix[4] = -sinB;
    r_matrix[5] = cosB;
    gl.uniformMatrix4fv(rotation, false, r_matrix);
  };

  // Set scale matrix (transposed)
  var S = 0.5;
  var s_matrix = new Float32Array([
    S,
    0.0,
    0.0,
    0.0,
    0.0,
    S,
    0.0,
    0.0,
    0.0,
    0.0,
    S,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
  ]);
  gl.uniformMatrix4fv(scale, false, s_matrix);

  const setScale = (S) => {
    s_matrix[0] = S;
    s_matrix[5] = S;
    s_matrix[10] = S;
    gl.uniformMatrix4fv(scale, false, s_matrix);
  };

  // Set the clear color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  canvas.addEventListener("mousemove", ({ clientX, clientY }) => {
    mouse.x = clientX;
    mouse.y = clientY;
  });

  let isRunning = true;

  const loop = () => {
    if (isRunning) {
      requestAnimationFrame(loop);
    }

    const nx = mouse.x / window.innerWidth;
    const ny = mouse.y / window.innerHeight;
    translate(nx * 2 - 1, ny * 2 - 1);
    rotate(nx * Math.PI * 2);
    setScale(ny * 2);

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Render
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  loop();

  return () => {
    reset();
    isRunning = false;
  };
};
