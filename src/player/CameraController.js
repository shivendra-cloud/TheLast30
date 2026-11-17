import * as THREE from 'three';

export class CameraController {
  constructor(camera, input) {
    this.camera = camera;
    this.input = input;

    this.yaw = 0;
    this.pitch = 0;

    this.distance = 6.5;
    this.targetDistance = 6.5;

    this.sensitivity = 0.0025;

    this.target = new THREE.Vector3();
    this.orbitDirection = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.cameraOffset = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();

    this.shoulderOffset = new THREE.Vector3();
    this.targetShoulderOffset = new THREE.Vector3();

    this.raycaster = new THREE.Raycaster();

    this.initialized = false;

    // Mouse down looks down; mouse up looks up.
    this.minPitch = -1.05;
    this.maxPitch = 1.48;

    this.collisionPadding = 0.35;
    this.minimumDistance = 0.8;
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

    const sensitivity =
      this.sensitivity * (isAiming ? 0.5 : 1);

    const { dx, dy } = this.input.consumeMouseDelta();

    this.yaw -= dx * sensitivity;
    this.pitch -= dy * sensitivity;

    this.pitch = THREE.MathUtils.clamp(
      this.pitch,
      this.minPitch,
      this.maxPitch
    );

    // Focus on the character's upper body.
    this.target.set(
      player.position.x,
      player.position.y + 0.95,
      player.position.z
    );

    if (!this.initialized) {
      this.distance = this.targetDistance;
      this.initialized = true;
    }

    // TRUE THIRD-PERSON ORBIT:
    // The camera moves around the character when pitch changes.
    // It does not simply tilt from a fixed camera position.
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);

    this.orbitDirection.set(
      Math.sin(this.yaw) * cosPitch,
      -sinPitch,
      Math.cos(this.yaw) * cosPitch
    ).normalize();

    // Desired camera offset from the character.
    this.cameraOffset
      .copy(this.orbitDirection)
      .multiplyScalar(this.targetDistance);

    // Check for walls and obstacles between player and camera.
    const meshes = colliders
      .map(c => c.mesh)
      .filter(
        mesh => mesh && mesh.isObject3D && mesh.visible
      );

    let safeDistance = this.targetDistance;

    if (meshes.length > 0) {
      this.raycaster.set(
        this.target,
        this.orbitDirection
      );

      this.raycaster.near = 0.05;
      this.raycaster.far = this.targetDistance;

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

    // Move inward immediately when obstructed.
    // Move outward smoothly when the obstruction disappears.
    if (safeDistance < this.distance) {
      this.distance = safeDistance;
    } else {
      this.distance +=
        (safeDistance - this.distance) *
        Math.min(1, dt * 8);
    }

    this.distance = Math.min(
      this.distance,
      this.targetDistance
    );

    // Place camera on the orbit.
    this.camera.position
      .copy(this.target)
      .addScaledVector(
        this.orbitDirection,
        this.distance
      );

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

    // Never allow camera to go below the ground.
    const minimumCameraY = player.position.y + 0.25;

    if (this.camera.position.y < minimumCameraY) {
      this.camera.position.y = minimumCameraY;
    }

    // Always keep the character as the camera's focus.
    this.lookTarget.copy(this.target);

    this.camera.lookAt(this.lookTarget);
  }
}
