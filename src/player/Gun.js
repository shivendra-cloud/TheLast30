import * as THREE from 'three';

// A pistol built from raw boxes/cylinders (no external models).
// mode 'fps': attach to the camera, gun shows bottom-right of screen.
// mode 'tps': attach to the player's mesh/group, gun sits at the right hand.
export default class Gun {
  constructor(camera, scene) {
    const parent = camera;
    this.group = new THREE.Group();
    this.recoilKick = 0;
    this.flashTimer = 0;
    this.time = 0;

    const dark = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const metal = new THREE.MeshLambertMaterial({ color: 0x4a4d52 });
    const grip = new THREE.MeshLambertMaterial({ color: 0x3b2a1e });

    // Slide (top body)
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.38), metal);
    slide.position.set(0, 0.05, -0.1);
    this.group.add(slide);

    // Lower frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.3), dark);
    frame.position.set(0, -0.01, -0.08);
    this.group.add(frame);

    // Barrel tip
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.08, 8), dark);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.05, -0.33);
    this.group.add(barrel);

    // Grip (angled)
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.08), grip);
    handle.position.set(0, -0.11, 0.05);
    handle.rotation.x = 0.25;
    this.group.add(handle);

    // Trigger guard
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.1), dark);
    guard.position.set(0, -0.06, -0.06);
    this.group.add(guard);

    // Front and rear sights
    const sightF = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.025, 0.015), dark);
    sightF.position.set(0, 0.11, -0.27);
    this.group.add(sightF);
    const sightR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.015), dark);
    sightR.position.set(0, 0.11, 0.07);
    this.group.add(sightR);

    // Muzzle flash (hidden until shoot)
    this.flash = new THREE.Mesh(
      new THREE.PlaneGeometry(0.25, 0.25),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })
    );
    this.flash.position.set(0, 0.05, -0.42);
    this.flash.visible = false;
    this.group.add(this.flash);

    // Always draw on top, never culled, never clipped by the near plane
    this.group.traverse((o) => {
      if (o.isMesh) {
        o.frustumCulled = false;
        o.renderOrder = 999;
        o.castShadow = false;
      }
    });

    // First-person position (relative to the camera): right, down, forward
    this.base = new THREE.Vector3(0.25, -0.22, -0.55);
    this.group.position.copy(this.base);

    // Make sure the camera is in the scene, otherwise its children never render
    const camera = parent;
    camera.near = 0.05;
    camera.updateProjectionMatrix();
    camera.add(this.group);
    if (!camera.parent && scene) scene.add(camera);

    // Small light on the camera so the gun is never dark
    const light = new THREE.PointLight(0xffffff, 0.8, 3);
    light.position.set(0, 0.2, 0.3);
    camera.add(light);
  }

  // Call when the player fires
  shoot() {
    this.recoilKick = 1;
    this.flashTimer = 0.05;
    this.flash.visible = true;
    this.flash.rotation.z = Math.random() * Math.PI;
  }

  // Call every frame. moving = true while the player walks (adds sway)
  update(dt, moving = false) {
    this.time += dt;
    this.recoilKick = Math.max(0, this.recoilKick - dt * 10);

    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) this.flash.visible = false;
    }

    const bob = moving ? Math.sin(this.time * 9) * 0.008 : Math.sin(this.time * 1.5) * 0.002;
    this.group.position.set(
      this.base.x,
      this.base.y + bob,
      this.base.z + this.recoilKick * 0.06
    );
    this.group.rotation.x = this.recoilKick * 0.15; // muzzle climbs
  }
}
