export class InputManager {
  constructor() {
    this.keys = Object.create(null);

    this.mouseDX = 0;
    this.mouseDY = 0;

    this.rightMouse = false;
    this.mobileAiming = false;
    this.shootQueued = false;
    this.fireHeld = false;

    this.isTouchDevice =
      window.matchMedia('(pointer: coarse)').matches ||
      navigator.maxTouchPoints > 0;

    this.mouseLocked = false;
    this.lookPointerId = null;

    this.joystickPointerId = null;
    this.joystickX = 0;
    this.joystickY = 0;

    this.createMobileControls();

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'Escape') {
        document.exitPointerLock?.();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.mouseLocked || this.isTouchDevice) return;

      this.mouseDX += e.movementX || 0;
      this.mouseDY += e.movementY || 0;
    });

    document.addEventListener('mousedown', (e) => {
      if (e.button === 2) this.rightMouse = true;

      if (e.button === 0 && !this.isTouchDevice) {
        this.shootQueued = true;
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button === 2) this.rightMouse = false;
    });

    document.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      this.mouseLocked =
        document.pointerLockElement != null || this.isTouchDevice;
    });

    if (this.isTouchDevice) {
      this.mouseLocked = true;
      this.setupTouchLook();
    }
  }

  createMobileControls() {
    const style = document.createElement('style');

    style.textContent = `
      #mobile-fps-controls {
        position: fixed;
        inset: 0;
        z-index: 99999;
        pointer-events: none;
        display: none;
        font-family: Arial, sans-serif;
        user-select: none;
        -webkit-user-select: none;
      }

      @media (pointer: coarse), (max-width: 800px) {
        #mobile-fps-controls { display: block; }
      }

      #mobile-joystick {
        position: absolute;
        left: 25px;
        bottom: 35px;
        width: 142px;
        height: 142px;
        border-radius: 50%;
        background: rgba(20, 25, 22, 0.38);
        border: 2px solid rgba(255,255,255,0.48);
        pointer-events: auto;
        touch-action: none;
      }

      #mobile-joystick-knob {
        position: absolute;
        left: 42px;
        top: 42px;
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: rgba(220,225,218,0.72);
        border: 2px solid white;
        box-sizing: border-box;
        pointer-events: none;
      }

      .mobile-action {
        position: absolute;
        pointer-events: auto;
        touch-action: none;
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.7);
        color: white;
        background: rgba(25,30,27,0.58);
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        text-shadow: 0 1px 3px black;
      }

      #mobile-fire {
        width: 83px;
        height: 83px;
        right: 28px;
        bottom: 62px;
        background: rgba(160,35,25,0.72);
        font-size: 14px;
      }

      #mobile-aim {
        width: 62px;
        height: 62px;
        right: 126px;
        bottom: 74px;
        font-size: 12px;
      }

      #mobile-reload {
        width: 55px;
        height: 55px;
        right: 38px;
        bottom: 160px;
        font-size: 11px;
      }

      @media (orientation: landscape) {
        #mobile-joystick {
          left: 28px;
          bottom: 24px;
        }
        #mobile-fire {
          right: 35px;
          bottom: 35px;
        }
        #mobile-aim {
          right: 135px;
          bottom: 45px;
        }
        #mobile-reload {
          right: 48px;
          bottom: 135px;
        }
      }
    `;

    document.head.appendChild(style);

    const controls = document.createElement('div');
    controls.id = 'mobile-fps-controls';

    controls.innerHTML = `
      <div id="mobile-joystick">
        <div id="mobile-joystick-knob"></div>
      </div>
      <div id="mobile-fire" class="mobile-action">FIRE</div>
      <div id="mobile-aim" class="mobile-action">AIM</div>
      <div id="mobile-reload" class="mobile-action">RELOAD</div>
    `;

    document.body.appendChild(controls);

    this.controlsElement = controls;
    this.joystick = controls.querySelector('#mobile-joystick');
    this.knob = controls.querySelector('#mobile-joystick-knob');

    const fire = controls.querySelector('#mobile-fire');
    const aim = controls.querySelector('#mobile-aim');
    const reload = controls.querySelector('#mobile-reload');

    const stop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    this.joystick.addEventListener('pointerdown', (e) => {
      stop(e);
      this.joystickPointerId = e.pointerId;
      this.joystick.setPointerCapture(e.pointerId);
      this.updateJoystick(e);
    });

    this.joystick.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.joystickPointerId) return;
      stop(e);
      this.updateJoystick(e);
    });

    const releaseJoystick = (e) => {
      if (e.pointerId !== this.joystickPointerId) return;

      this.joystickPointerId = null;
      this.joystickX = 0;
      this.joystickY = 0;

      this.setMovementKeys(0, 0);

      this.knob.style.left = '42px';
      this.knob.style.top = '42px';
    };

    this.joystick.addEventListener('pointerup', releaseJoystick);
    this.joystick.addEventListener('pointercancel', releaseJoystick);

    fire.addEventListener('pointerdown', (e) => {
      stop(e);
      this.fireHeld = true;
      this.shootQueued = true;
    });

    const stopFire = (e) => {
      this.fireHeld = false;
      e.preventDefault();
    };

    fire.addEventListener('pointerup', stopFire);
    fire.addEventListener('pointercancel', stopFire);
    fire.addEventListener('lostpointercapture', () => {
      this.fireHeld = false;
    });

    aim.addEventListener('pointerdown', (e) => {
      stop(e);
      this.mobileAiming = true;
    });

    const stopAim = () => {
      this.mobileAiming = false;
    };

    aim.addEventListener('pointerup', stopAim);
    aim.addEventListener('pointercancel', stopAim);
    aim.addEventListener('lostpointercapture', stopAim);

    reload.addEventListener('pointerdown', (e) => {
      stop(e);
      this.keys['KeyR'] = true;
      this.reloadQueued = true;
    });

    reload.addEventListener('pointerup', () => {
      this.keys['KeyR'] = false;
    });
    reload.addEventListener('pointercancel', () => {
      this.keys['KeyR'] = false;
    });
  }

  updateJoystick(e) {
    const rect = this.joystick.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let x = e.clientX - centerX;
    let y = e.clientY - centerY;

    const maxDistance = 43;
    const distance = Math.sqrt(x * x + y * y);

    if (distance > maxDistance) {
      x = (x / distance) * maxDistance;
      y = (y / distance) * maxDistance;
    }

    this.joystickX = x / maxDistance;
    this.joystickY = y / maxDistance;

    this.knob.style.left = `${42 + x}px`;
    this.knob.style.top = `${42 + y}px`;

    this.setMovementKeys(this.joystickX, this.joystickY);
  }

  setMovementKeys(x, y) {
    this.keys['KeyW'] = y < -0.2;
    this.keys['KeyS'] = y > 0.2;
    this.keys['KeyA'] = x < -0.2;
    this.keys['KeyD'] = x > 0.2;
  }

  setupTouchLook() {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvas.style.touchAction = 'none';

    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;

      this.lookPointerId = e.pointerId;
      this.lastLookX = e.clientX;
      this.lastLookY = e.clientY;
    });

    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'touch' || e.pointerId !== this.lookPointerId) {
        return;
      }

      e.preventDefault();

      const dx = e.clientX - this.lastLookX;
      const dy = e.clientY - this.lastLookY;

      this.mouseDX += dx * 1.6;
      this.mouseDY += dy * 1.6;

      this.lastLookX = e.clientX;
      this.lastLookY = e.clientY;
    }, { passive: false });

    const stopLook = (e) => {
      if (e.pointerId === this.lookPointerId) {
        this.lookPointerId = null;
      }
    };

    canvas.addEventListener('pointerup', stopLook);
    canvas.addEventListener('pointercancel', stopLook);
  }

  lockPointer() {
    if (this.isTouchDevice) {
      this.mouseLocked = true;
      return;
    }

    document.body.requestPointerLock?.();
  }

  consumeShoot() {
    const result = this.shootQueued || this.fireHeld;
    this.shootQueued = false;
    return result;
  }

  consumeMouseDelta() {
    const result = {
      dx: this.mouseDX,
      dy: this.mouseDY
    };

    this.mouseDX = 0;
    this.mouseDY = 0;

    return result;
  }

  isAiming() {
    return this.rightMouse ||
      this.mobileAiming ||
      this.keys['KeyC'];
  }

  consumeReload() {
    const result = !!this.reloadQueued;
    this.reloadQueued = false;
    return result;
  }
}
