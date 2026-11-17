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
    this.cameraPosition = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.viewDirection = new THREE.Vector3();
    this.right = new THREE.Vector3();

    this.shoulderOffset = new THREE.Vector3();
    this.targetShoulderOffset = new THREE.Vector3();

    this.raycaster = new THREE.Raycaster();

    this.initialized = false;

    // Look freely up and down without flipping.
    this.minPitch = -1.15;
    this.maxPitch = 1.48;

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

    // Character upper-body focus.
    this.target.set(
      player.position.x,
      player.position.y + 0.85,
      player.position.z
    );

    if (!this.initialized) {
      this.initialized = true;
      this.distance = this.targetDistance;
    }

    // Camera remains BEHIND the character.
    // Vertical mouse movement changes the viewing direction,
    // NOT the camera's orbit around the character.
    const horizontalBack = new THREE.Vector3(
      Math.sin(this.yaw),
      0,
      Math.cos(this.yaw)
    );

    this.cameraPosition.copy(this.target);

    this.cameraPosition.addScaledVector(
      horizontalBack,
      this.targetDistance
    );

    // Keep camera at normal third-person height.
    this.cameraPosition.y += 0.45;

    // Camera collision detection.
    const meshes = colliders
      .map(c => c.mesh)
      .filter(
        mesh => mesh && mesh.isObject3D && mesh.visible
      );

    const cameraOffset = new THREE.Vector3()
      .subVectors(this.cameraPosition, this.target);

    const rayDistance = cameraOffset.length();

    let safeDistance = this.targetDistance;

    if (meshes.length > 0 && rayDistance > 0) {
      this.direction
        .copy(cameraOffset)
        .normalize();

      this.raycaster.set(
        this.target,
        this.direction
      );

      this.raycaster.near = 0.05;
      this.raycaster.far = rayDistance;

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

    this.camera.position
      .copy(this.target)
      .addScaledVector(horizontalBack, this.distance);

    this.camera.position.y += 0.45;

    // Shoulder camera when aiming.
    this.right.set(
      Math.cos(this.yaw),
      0,
      -Math.sin(this.yaw)
    );

    this.camera.position.addScaledVector(
      this.right,
      this.shoulderOffset.x
    );

    // Prevent camera from entering the ground.
    const minimumCameraY = player.position.y + 0.20;

    if (this.camera.position.y < minimumCameraY) {
      this.camera.position.y = minimumCameraY;
    }

    // Independent viewing direction.
    // Mouse up = look at sky.
    // Mouse down = look towards ground.
    const cosPitch = Math.cos(this.pitch);

    this.viewDirection.set(
      -Math.sin(this.yaw) * cosPitch,
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * cosPitch
    ).normalize();

    const lookTarget = new THREE.Vector3()
      .copy(this.camera.position)
      .addScaledVector(this.viewDirection, 20);

    this.camera.lookAt(lookTarget);
  }
}
