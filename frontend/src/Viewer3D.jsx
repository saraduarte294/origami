import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildStates, frame } from './fold.js';

// Muestra el papel en 3D. En cada paso anima el doblez; se puede girar con el mouse.
export default function Viewer3D({ plegado, paso, replay }) {
  const box = useRef(null);
  const api = useRef({});
  const states = useMemo(() => buildStates(plegado), [plegado]);
  api.current.data = { states, ops: plegado.ops, papel: plegado.papel };

  useEffect(() => {
    const el = box.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.set(0, -3.4, 6.4);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(2, -3, 6);
    scene.add(sun);
    const group = new THREE.Group();
    scene.add(group);

    const clear = () => {
      group.children.forEach((c) => { c.geometry?.dispose(); c.material?.dispose?.(); });
      group.clear();
    };
    const draw = (faces) => {
      clear();
      const { colorA, colorB } = api.current.data.papel;
      for (const f of faces) {
        const pos = [];
        for (let i = 1; i < f.pts3.length - 1; i++) pos.push(...f.pts3[0], ...f.pts3[i], ...f.pts3[i + 1]);
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.computeVertexNormals();
        const mk = (color, side) => new THREE.MeshLambertMaterial({ color, side, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
        group.add(new THREE.Mesh(g, mk(f.back ? colorB : colorA, THREE.FrontSide)));
        group.add(new THREE.Mesh(g.clone(), mk(f.back ? colorA : colorB, THREE.BackSide)));
        group.add(new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(f.pts3.map((v) => new THREE.Vector3(...v))),
          new THREE.LineBasicMaterial({ color: 0x2a2a2a })));
      }
    };

    let anim = null, raf;
    api.current.play = (i) => {
      const { states, ops } = api.current.data;
      const op = ops[i];
      if (!op) { anim = null; draw(frame(states[i], null)); return; }
      anim = { t0: performance.now(), dur: 1500, from: states[i], to: states[i + 1], op };
    };
    api.current.play(0);

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (anim) {
        const k = Math.min(1, (now - anim.t0) / anim.dur);
        if (k >= 1) { draw(frame(anim.to, null)); anim = null; }
        else draw(frame(anim.from, anim.op, k * k * (3 - 2 * k)));
      }
      controls.update();
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); clear(); controls.dispose(); renderer.dispose(); el.removeChild(renderer.domElement); };
  }, []);

  useEffect(() => { api.current.play?.(paso); }, [states, paso, replay]);

  return <div ref={box} className="viewer" role="img" aria-label="Vista 3D del papel. Arrastra para girar." />;
}
