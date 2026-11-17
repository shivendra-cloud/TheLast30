import * as THREE from 'three';

export class CameraController {
  constructor(camera, input) {
    this.camera = camera;
    this.input = input;

    this.yaw = 0;
    this.pitch = 0;
    this.sensitivity = 0.0022;

    this.eyeHeight = 0.62;

    this.minPitch = -Math.PI / 2 + 0.01;
    this.maxPitch = Math.PI / 2 - 0.01;

    this.camera.rotation.order = 'YXZ';
  }

  update(dt, player, colliders = []) {
    const { dx, dy } = this.input.consumeMouseDelta();

    // Horizontal and vertical FPS mouse look.
    this.yaw -= dx * this.sensitivity;
    this.pitch -= dy * this.sensitivity;

    this.pitch = THREE.MathUtils.clamp(
      this.pitch,
      this.minPitch,
      this.maxPitch
    );

    // Position camera at the character's eye level.
    this.camera.position.set(
      player.position.x,
      player.position.y + this.eyeHeight,
      player.position.z
    );

    // Direct first-person rotation.
    this.camera.rotation.set(
      this.pitch,
      this.yaw,
      0,
      'YXZ'
    );
  }
}
