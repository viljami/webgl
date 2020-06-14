/*
  Directional Light
  ( = Diffuse Light )

  Equivalent to sunlight on Earth.
  All light rays come from the same direction.

  Ambient light
  - the light that is everywhere (prevents total blackness)
*/

import { cube, sphere } from './lib/shapes.js';
import { perspective, transform, orthogonal } from "./lib/matrix.js";
import { bindReset } from "./lib/reset.js";

const deg2rad = (angle) => (Math.PI * angle) / 180;

export default (canvas, compile, bindBuffer) => {
  const gl = canvas.getContext('webgl');

  const reset = bindReset(gl);

  const vshader = `
  attribute vec4 position;
  attribute vec4 color;
  attribute vec3 normal;
  uniform mat4 camera;
  uniform vec3 lightColor;
  uniform vec3 lightDirection;
  uniform vec3 ambientLight;
  varying vec4 v_color;

  void main() {

    // Apply the camera matrix to the vertex position
    gl_Position = camera * position;

    // Compute angle between the normal and that direction
    float nDotL = max(dot(lightDirection, normalize(normal)), 0.0);

    // Compute diffuse light proportional to this angle
    vec3 diffuse = lightColor * color.rgb * nDotL;

    vec3 ambient = ambientLight * color.rgb;

    // Set the varying color
    v_color = vec4(diffuse + ambient, 1.0);
  }`;

  const fshader = `
  precision mediump float;
  varying vec4 v_color;
  void main() {
    gl_FragColor = v_color;
  }`;

  const program = compile(gl, vshader, fshader);
  // const [vertices, normals, indices] = cube();
  const [vertices, normals, indices] = sphere();
  const n = indices.length;

  const verticesBuffer = bindBuffer(gl, vertices, program, 'position', 3, gl.FLOAT);
  const normalsBuffer = bindBuffer(gl, normals, program, 'normal', 3, gl.FLOAT);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  const color = gl.getAttribLocation(program, 'color');
  gl.vertexAttrib3f(color, 1, 0, 0);

  gl.clearColor(0, 0, 0, 1);

  gl.enable(gl.DEPTH_TEST);

  let cameraMatrix = perspective({fov: deg2rad(30), aspect: 1, near: 1, far: 100});
  cameraMatrix = transform(cameraMatrix, {z: -5, rx: .7, ry: -.8});
  const camera = gl.getUniformLocation(program, 'camera');
  gl.uniformMatrix4fv(camera, false, cameraMatrix);

  const lightColor = gl.getUniformLocation(program, 'lightColor');
  const lightDirection = gl.getUniformLocation(program, 'lightDirection');
  const ambientLight = gl.getUniformLocation(program, "ambientLight");
  gl.uniform3f(ambientLight, 0.2, 0.2, 0.2);

  let isRunning = true;
  let light = 1.0;
  let angle = 0.0;

  const step = () => {
    if (isRunning) {
      requestAnimationFrame(step);
    }

    angle += 0.02;

    gl.uniform3f(lightColor, light, light, light);
    gl.uniform3f(lightDirection, 0.7, Math.cos(angle), Math.sin(angle));

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
  };

  step();

  return () => {
    reset();
    isRunning = false;
  };
};
