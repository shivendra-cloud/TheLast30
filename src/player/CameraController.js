import * as THREE from 'three';

export class CameraController {
  constructor(camera, input) {
    this.camera = camera;
    this.input = input;
    this.yaw = 0;
    this.pitch = 0.15;
    this.distance = 7.0;
    this.targetDistance = 7.0;
    this.sensitivity = 0.0025;
    this.target = new THREE.Vector3();
    
    this.shoulderOffset = new THREE.Vector3(0, 0, 0);
    this.targetShoulderOffset = new THREE.Vector3(0, 0, 0);
    
    this.raycaster = new THREE.Raycaster();
  }

  update(dt, player, colliders) {
    const isAiming = this.input.isAiming();
    
    this.targetDistance = isAiming ? 2.5 : 7.0;
    this.targetShoulderOffset.set(isAiming ? 0.7 : 0, 0, 0);
    this.shoulderOffset.lerp(this.targetShoulderOffset, Math.min(1, dt * 20));

    const sens = this.sensitivity * (isAiming ? 0.5 : 1.0);
    const { dx, dy } = this.input.consumeMouseDelta();
    this.yaw -= dx * sens;
    this.pitch -= dy * sens;
    this.pitch = Math.max(-0.6, Math.min(1.1, this.pitch));

    const focus = new THREE.Vector3(player.position.x, player.position.y + 0.6, player.position.z);
    this.target.lerp(focus, Math.min(1, dt * 25)); // Snappier camera follow

    const cosPitch = Math.cos(this.pitch);
    const dir = new THREE.Vector3(
      Math.sin(this.yaw) * cosPitch,
      Math.sin(this.pitch),
      Math.cos(this.yaw) * cosPitch
    ).normalize();

    this.raycaster.set(this.target, dir);
    this.raycaster.far = this.targetDistance;
    
    const meshes = colliders.map(c => c.mesh).filter(m => m);
    const hits = this.raycaster.intersectObjects(meshes, false);
    
    let actualDistance = this.targetDistance;
    if (hits.length > 0) {
      actualDistance = Math.max(1.0, hits[0].distance - 0.2);
    }

    this.distance += (actualDistance - this.distance) * Math.min(1, dt * 15);

    this.camera.position.copy(this.target).add(dir.multiplyScalar(this.distance));
      
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this.camera.position.add(right.multiplyScalar(this.shoulderOffset.x));

    this.camera.position.y += isAiming ? 1.4 : 1.2;
    this.camera.lookAt(this.target);
  }
}
