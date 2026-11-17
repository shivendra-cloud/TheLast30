export class InputManager {
  constructor() {
    this.keys = Object.create(null);
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.rightMouse = false;
    this.shootQueued = false;
    this.mouseLocked = false;

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Escape') document.exitPointerLock?.();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    document.addEventListener('mousemove', (e) => {
      if (!this.mouseLocked) return;
      this.mouseDX += e.movementX || 0;
      this.mouseDY += e.movementY || 0;
    });

    document.addEventListener('mousedown', (e) => {
      if (!this.mouseLocked) return;
      if (e.button === 2) this.rightMouse = true;
      if (e.button === 0) this.shootQueued = true;
    });
    document.addEventListener('mouseup', (e) => {
      if (e.button === 2) this.rightMouse = false;
    });
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      this.mouseLocked = document.pointerLockElement != null;
    });
  }

  lockPointer() {
    document.body.requestPointerLock?.();
  }

  consumeShoot() {
    const v = this.shootQueued;
    this.shootQueued = false;
    return v;
  }

  consumeMouseDelta() {
    const dx = this.mouseDX;
    const dy = this.mouseDY;
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx, dy };
  }

  // Helper to check if aiming (holding C or Right Mouse)
  isAiming() {
    return this.rightMouse || this.keys['KeyC'];
  }
}
