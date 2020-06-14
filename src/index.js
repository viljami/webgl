import { compile, bindBuffer } from './lib/webgl.js';
import color from "./triangle-color.js";
import transform from "./triangle-transform.js";
import texturing from './texturing.js';
import cube from './cube.js';
import cubeColored from './cube-colored.js';
import shading from './directional-light.js';
import pointLight from './point-light.js';
import spotLight from './spot-light.js';

const init = () => {
  const canvas = document.createElement("canvas");
  const title = document.createElement("h1");
  const text = document.createElement("p");

  const inc = (n) => n + 1;
  const limit = (l) => (n) => (n >= l ? 0 : n);

  const resize = () => {
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    // canvas.width = 200;
    // canvas.height = 150;
  };

  const next = (function() {
    const demos = [
      { title: "Color", fn: color, description: "Move mouse to see color shifting." },
      { title: "Transform", fn: transform, description: "Move mouse to transform triangle position, rotation and scale." },
      { title: "Texturing", fn: texturing, description: "Image displayed on time transformed triangles." },
      // { title: "Cube 1", fn: cube, description: "First cube." },
      { title: "Colored Cube", fn: cubeColored, description: "Cube with one color sides." },
      { title: "Directional light", fn: shading, description: "Lighting testing." },
      { title: "Point light", fn: pointLight, description: "Moving point light." },
      { title: "Spot light", fn: spotLight, description: "Moving spot light." }
    ];
    const demosLimit = limit(demos.length);

    let currentIndex = 5;

    return () => {
      currentIndex = demosLimit(inc(currentIndex));

      if (stop) {
        stop();
      }

      const demo = demos[currentIndex];
      title.innerText = demo.title;
      text.innerText = demo.description;

      stop = demo.fn(canvas, compile, bindBuffer);
    };
  })();

  resize();

  document.body.appendChild(canvas);
  document.body.appendChild(title);
  document.body.appendChild(text);

  canvas.addEventListener('click', next);
  canvas.addEventListener('keyup', next);

  window.addEventListener('resize', resize);

  next();
};

window.addEventListener('load', function load() {
  window.removeEventListener('load', load);
  init();
});
