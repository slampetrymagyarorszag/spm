import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function LetterScene() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30);
    camera.position.z = 7;
    const alphabet = 'ABCDEFGHIJKLMNOPRSTUVXYZÁÉÍÓÖŐÚÜŰ?!';
    const textures: THREE.Texture[] = [];
    const group = new THREE.Group();
    scene.add(group);
    const glyphs: { sprite: THREE.Sprite; base: THREE.Vector3; phase: number }[] = [];
    let disposed = false;
    let visible = true;
    const pointer = new THREE.Vector2();
    const target = new THREE.Vector2();
    const timer = new THREE.Timer();
    timer.connect(document);
    const size = () => { const { width, height } = el.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); };
    const resize = new ResizeObserver(size); resize.observe(el); size();
    const render = () => {
      timer.update();
      const time = reduced.matches ? 0 : timer.getElapsed();
      pointer.lerp(target, 0.035);
      group.rotation.y = time * 0.07 + pointer.x * 0.25;
      group.rotation.x = pointer.y * 0.15;
      const progress = Math.max(0, Math.min(1, -el.getBoundingClientRect().top / Math.max(el.clientHeight, 1)));
      group.scale.setScalar(1 - progress * 0.18);
      for (const { sprite, base, phase } of glyphs) {
        const wave = reduced.matches ? 1 : 1 + Math.sin(time * 0.6 + phase) * 0.055;
        sprite.position.copy(base).multiplyScalar(wave);
        const distance = Math.hypot(base.x - pointer.x * 2, base.y - pointer.y * 2);
        if (!reduced.matches && distance < 1.3) sprite.position.z += (1.3 - distance) * 0.45;
      }
      renderer.render(scene, camera);
    };
    const sync = () => {
      const active = visible && !document.hidden && !reduced.matches;
      renderer.setAnimationLoop(active ? render : null);
      if (!document.hidden) render();
    };
    const build = () => {
      if (disposed) return;
      const materials = Array.from(alphabet).map((letter, i) => {
        const tile = document.createElement('canvas'); tile.width = 128; tile.height = 128;
        const c = tile.getContext('2d')!; c.font = '86px Anton, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(letter, 64, 66);
        const texture = new THREE.CanvasTexture(tile); textures.push(texture);
        return new THREE.SpriteMaterial({ map: texture, color: i % 3 ? '#b13bd6' : '#db91ef', transparent: true, depthWrite: false });
      });
      const count = window.innerWidth < 700 ? 58 : 94;
      for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const angle = i * Math.PI * (3 - Math.sqrt(5));
        const base = new THREE.Vector3(Math.cos(angle) * r * 2, y * 2, Math.sin(angle) * r * 2);
        const sprite = new THREE.Sprite(materials[i % materials.length]);
        sprite.position.copy(base); sprite.scale.setScalar(0.32 + (i % 4) * 0.035);
        group.add(sprite); glyphs.push({ sprite, base, phase: i });
      }
      el.dataset.ready = 'true'; sync();
    };
    void document.fonts.load('86px Anton').then(build).catch(build);
    const onMove = (event: PointerEvent) => { if (reduced.matches) return; const rect = el.getBoundingClientRect(); target.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height * 2 - 1)); };
    const onLeave = () => target.set(0, 0);
    el.addEventListener('pointermove', onMove); el.addEventListener('pointerleave', onLeave);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }); intersection.observe(el);
    document.addEventListener('visibilitychange', sync); reduced.addEventListener('change', sync);
    const lost = (event: Event) => { event.preventDefault(); renderer.setAnimationLoop(null); delete el.dataset.ready; };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    return () => {
      disposed = true; renderer.setAnimationLoop(null); resize.disconnect(); intersection.disconnect(); timer.dispose();
      document.removeEventListener('visibilitychange', sync); reduced.removeEventListener('change', sync);
      el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      for (const texture of textures) texture.dispose();
      const mats = new Set(glyphs.map(({ sprite }) => sprite.material)); for (const material of mats) material.dispose();
      renderer.dispose(); renderer.domElement.remove(); delete el.dataset.ready;
    };
  }, []);
  return <div className="education-letter-scene" ref={host} aria-hidden="true" />;
}
