import * as THREE from 'three';

export class World {
  constructor(container) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9bb2c7); // Slightly moodier sky
    this.scene.fog = new THREE.FogExp2(0x9bb2c7, 0.008); // Fog for depth perception

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    container.appendChild(this.renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x666666, 1.0);
    this.scene.add(hemi);

    // Strong sun casting long shadows to highlight 3D depth
    const sun = new THREE.DirectionalLight(0xfff5e6, 2.0);
    sun.position.set(50, 40, -30); 
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    sun.shadow.camera.far = 200;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

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
