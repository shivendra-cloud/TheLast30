import * as THREE from 'three';

export class CameraController {
  constructor(camera, input) {
    this.camera = camera;
    this.input = input;

    this.yaw = 0;
    this.pitch = 0.28;

    this.distance = 6.5;
    this.targetDistance = 6.5;

    this.sensitivity = 0.0025;

    this.target = new THREE.Vector3();
    this.shoulderOffset = new THREE.Vector3();
    this.targetShoulderOffset = new THREE.Vector3();

    this.raycaster = new THREE.Raycaster();
    this.direction = new THREE.Vector3();
    this.right = new THREE.Vector3();

    this.initialized = false;

    // Allow almost complete vertical camera movement.
    this.minPitch = -Math.PI / 2 + 0.02;
    this.maxPitch = Math.PI / 2 - 0.02;

    // Camera collision protection.
    this.collisionPadding = 0.35;
    this.minimumDistance = 0.65;
  }

  update(dt, player, colliders = []) {
    const isAiming = this.input.isAiming();

    this.targetDistance = isAiming ? 2.5 : 6.5;

    this.targetShoulderOffset.set(
      isAiming ? 0.65 : 0,
      0,
      0
    );

    this.shoulderOffset.lerp(
      this.targetShoulderOffset,
      Math.min(1, dt * 12)
    );

    const sensitivity = this.sensitivity * (isAiming ? 0.5 : 1);

    const { dx, dy } = this.input.consumeMouseDelta();

    this.yaw -= dx * sensitivity;
    this.pitch -= dy * sensitivity;

    // Free vertical movement without camera flipping.
    this.pitch = THREE.MathUtils.clamp(
      this.pitch,
      this.minPitch,
      this.maxPitch
    );

    // Focus on player's upper body.
    const focus = new THREE.Vector3(
      player.position.x,
      player.position.y + 0.72,
      player.position.z
    );

    if (!this.initialized) {
      this.target.copy(focus);
      this.distance = this.targetDistance;
      this.initialized = true;
    } else {
      this.target.lerp(
        focus,
        Math.min(1, dt * 15)
      );
    }

    const cosPitch = Math.cos(this.pitch);

    this.direction.set(
      Math.sin(this.yaw) * cosPitch,
      Math.sin(this.pitch),
      Math.cos(this.yaw) * cosPitch
    ).normalize();

    const desiredDistance = this.targetDistance;

    // Detect camera obstruction using map collision meshes.
    const meshes = colliders
      .map(c => c.mesh)
      .filter(mesh => mesh && mesh.isObject3D && mesh.visible);

    let safeDistance = desiredDistance;

    if (meshes.length > 0) {
      this.raycaster.set(this.target, this.direction);
      this.raycaster.near = 0.05;
      this.raycaster.far = desiredDistance;

      const hits = this.raycaster.intersectObjects(
        meshes,
        false
      );

      if (hits.length > 0) {
        safeDistance = Math.max(
          this.minimumDistance,
          hits[0].distance - this.collisionPadding
        );
      }
    }

    // Pull in immediately when blocked.
    // Smoothly return when the obstruction disappears.
    if (safeDistance < this.distance) {
      this.distance = safeDistance;
    } else {
      this.distance +=
        (safeDistance - this.distance) *
        Math.min(1, dt * 5);
    }

    this.distance = Math.min(
      this.distance,
      desiredDistance
    );

    this.camera.position
      .copy(this.target)
      .addScaledVector(this.direction, this.distance);

    // Shoulder offset while aiming.
    this.right.set(
      Math.cos(this.yaw),
      0,
      -Math.sin(this.yaw)
    );

    this.camera.position.addScaledVector(
      this.right,
      this.shoulderOffset.x
    );

    // Prevent camera from going underneath player ground level.
    const minimumCameraY = player.position.y + 0.20;

    if (this.camera.position.y < minimumCameraY) {
      this.camera.position.y = minimumCameraY;
    }

    this.camera.lookAt(this.target);
  }
}
