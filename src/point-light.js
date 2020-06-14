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
      varying vec4 v_color;
      varying vec3 v_normal;
      varying vec3 v_position;

    void main() {

      // Apply the camera matrix to the vertex position
      gl_Position = camera * position;

      // Set varying position for the fragment shader
      v_position = vec3(position.xyz);

      // Set the face normal
      v_normal = normalize(normal);

      // Set the color
      v_color = color;
    }`;

  // Fragment shader program
  const fshader = `
  precision mediump float;
  uniform vec3 lightColor;
  uniform vec3 lightPosition;
  uniform vec3 ambientLight;
  varying vec3 v_normal;
  varying vec3 v_position;
  varying vec4 v_color;

  void main() {

    // Compute direction between the point light and the current fragment
    vec3 lightDirection = normalize(lightPosition - v_position);

    // Compute angle between the face normal and that direction
    float nDotL = max(dot(lightDirection, v_normal), 0.0);

    // Compute diffuse light proportional to this angle
    vec3 diffuse = lightColor * v_color.rgb * nDotL;

    // Compute distance from light to fragment
    float distance = length(lightPosition - v_position);

    // Compute light attenuation (3.0 / distance), clamped between 0 and 1.
    // The value 3.0 is freely editable and means that anything up to 3 units away from the light is fully lighted.
    float attenuation = clamp(3.0 / distance, -0.0, 1.0);

    // Compute ambient light
    vec3 ambient = ambientLight * v_color.rgb;

    // Compute total light (diffuse + ambient)
    gl_FragColor = vec4(attenuation * diffuse + ambient, 1.0);
  }`;

  const program = compile(gl, vshader, fshader);

  const [vertices, normals, indices] = cube();
  const n = indices.length; // Count vertices

  const verticesBuffer = bindBuffer(gl, vertices, program, 'position', 3, gl.FLOAT);
  const normalsBuffer = bindBuffer(gl, normals, program, 'normal', 3, gl.FLOAT);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  const color = gl.getAttribLocation(program, 'color');
  gl.vertexAttrib3f(color, 1, 0, 0);

  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);

  const cameraMatrix = transform(
    perspective({ fov: deg2rad(30), aspect: 1, near: 1, far: 100 }),
    {z: -3.5, rx: .5, ry: -.5}
  );
  const camera = gl.getUniformLocation(program, 'camera');
  gl.uniformMatrix4fv(camera, false, cameraMatrix);

  const lightColor = gl.getUniformLocation(program, 'lightColor');
  gl.uniform3f(lightColor, 1, 1, 1);
  const lightPosition = gl.getUniformLocation(program, 'lightPosition');
  gl.uniform3f(lightPosition, 1.4, 1.1, 1.5);

  const ambientLight = gl.getUniformLocation(program, 'ambientLight');
  gl.uniform3f(ambientLight, 0.1, 0.1, 0.1);

  let isRunning = true;
  let light = 1.0;
  let angle = 0.0;

  const step = () => {
    if (isRunning) {
      requestAnimationFrame(step);
    }

    angle += 0.02;

    // gl.uniform3f(lightColor, light, light, light);
    gl.uniform3f(lightPosition, 1.4, 1.1 + Math.cos(angle), 1.5 + Math.sin(angle));

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
  };

  step();

  return () => {
    reset();
    isRunning = false;
  };
};
