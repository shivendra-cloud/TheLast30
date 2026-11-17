import * as THREE from 'three';

export class World {
  constructor(container) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9aa3ad);
    this.scene.fog = new THREE.Fog(0x9aa3ad, 40, 110);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xbfd0e0, 0x445060, 0.85);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff0dd, 1.15);
    sun.position.set(30, 45, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    sun.shadow.camera.far = 120;
    this.scene.add(sun);
    this.sun = sun;

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    if (this.onResizeCallback) this.onResizeCallback(w, h);
  }

  render() {
    this.renderer.render(this.scene, this.activeCamera);
  }
}
