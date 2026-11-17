import * as THREE from 'three';

export class CameraController {
  constructor(camera, input) {
    this.camera = camera;
    this.input = input;
    this.yaw = 0;
    this.pitch = 0.15;
    this.distance = 6.5;
    this.targetDistance = 6.5;
    this.minDistance = 3.5;
    this.maxDistance = 9;
    this.sensitivity = 0.0022;
    this.target = new THREE.Vector3();
  }

  update(dt, player) {
    const { dx, dy } = this.input.consumeMouseDelta();
    this.yaw -= dx * this.sensitivity;
    this.pitch -= dy * this.sensitivity;
    this.pitch = Math.max(-0.6, Math.min(1.1, this.pitch));

    this.targetDistance = this.input.rightMouse ? 3.8 : 6.5;
    this.distance += (this.targetDistance - this.distance) * Math.min(1, dt * 8);

    const focus = new THREE.Vector3(player.position.x, player.position.y + 0.6, player.position.z);
    this.target.lerp(focus, Math.min(1, dt * 18));

    const cosPitch = Math.cos(this.pitch);
    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * cosPitch * this.distance,
      Math.sin(this.pitch) * this.distance + 1.2,
      Math.cos(this.yaw) * cosPitch * this.distance
    );

    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  }
}
