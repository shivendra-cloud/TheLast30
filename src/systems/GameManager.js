import * as THREE from 'three';
import { World } from '../world/World.js';
import { Environment } from '../world/Environment.js';
import { Player } from '../player/Player.js';
import { CameraController } from '../player/CameraController.js';
import { Weapon } from '../player/Weapon.js';
import { NPCManager } from '../npc/NPCManager.js';
import { InfectionSystem } from '../npc/InfectionSystem.js';
import { ShootingSystem } from './ShootingSystem.js';
import { InputManager } from './InputManager.js';
import { HUD } from '../ui/HUD.js';

export class GameManager {
  constructor(container) {
    this.container = container;
    this.world = new World(container);
    this.scene = this.world.scene;

    this.environment = new Environment(this.scene);

    this.camera = new THREE.PerspectiveCamera(
      62, window.innerWidth / window.innerHeight, 0.1, 250
    );
    this.world.activeCamera = this.camera;
    this.world.onResizeCallback = (w, h) => {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    };

    this.input = new InputManager();
    this.player = new Player(this.scene);
    this.cameraCtrl = new CameraController(this.camera, this.input);
    this.weapon = new Weapon(this.scene, this.player);
    this.npcManager = new NPCManager(this.scene);
    this.infectionSystem = new InfectionSystem(this.npcManager);

    this.uiRoot = document.createElement('div');
    this.uiRoot.id = 'hud';
    container.appendChild(this.uiRoot);
    this.hud = new HUD(this.uiRoot);

    this.shooting = new ShootingSystem(
      this.scene, this.camera, this.npcManager, this.hud, this.infectionSystem
    );

    this.overlay = document.createElement('div');
    this.overlay.id = 'overlay';
    this.overlay.innerHTML =
      '<h1>THE LAST 30</h1>' +
      '<div class="subtitle">IDENTIFY &middot; INVESTIGATE &middot; SURVIVE</div>' +
      '<div class="controls">' +
      '<b>WASD</b> Move &middot; <b>Mouse</b> Look &middot; <b>Space</b> Jump<br>' +
      '<b>Left Click / Z</b> Shoot &middot; <b>Right Click</b> Focus<br>' +
      '<b>Esc</b> Release cursor' +
      '</div>' +
      '<div class="start-hint">CLICK TO ENTER THE CITY</div>';
    container.appendChild(this.overlay);
    this.overlay.addEventListener('click', () => {
      this.overlay.classList.add('hidden');
      this.input.lockPointer();
      this.started = true;
    });

    this.gameover = document.createElement('div');
    this.gameover.id = 'gameover';
    container.appendChild(this.gameover);
    this.hud.onWin = () => this.endGame(true, 'THE INFECTED ARE GONE');
    this.gameOverActive = false;

    this.clock = new THREE.Clock();
    this.running = true;
  }

  start() {
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  loop() {
    if (!this.running) return;
    const dt = Math.min(0.05, this.clock.getDelta());

    if (this.started && !this.gameOverActive) {
      if (this.input.consumeShoot() && this.shooting.canFire() && this.weapon.canFire()) {
        const result = this.shooting.fire();
        if (result.point) this.weapon.fire(result.point);
      }
      if (this.input.keys['KeyZ'] && this.shooting.canFire() && this.weapon.canFire()) {
        const result = this.shooting.fire();
        if (result.point) this.weapon.fire(result.point);
      }

      this.player.update(dt, this.input, this.cameraCtrl.yaw, this.environment.colliders);
      this.npcManager.update(dt, this.player.position, this.environment.colliders);
      this.infectionSystem.update(dt);
      this.cameraCtrl.update(dt, this.player);
      this.weapon.update(dt);

      this.hud.updateInfection(this.infectionSystem.infectionPct);

      if (this.infectionSystem.lost) {
        this.endGame(false, 'THE CITY HAS FALLEN');
      }
    } else {
      this.camera.position.set(0, 6, 18);
      this.camera.lookAt(0, 1, 0);
    }

    this.world.render();
    requestAnimationFrame(this.loop);
  }

  endGame(won, subtitle) {
    if (this.gameOverActive) return;
    this.gameOverActive = true;
    document.exitPointerLock?.();
    this.gameover.classList.add('show');
    this.gameover.innerHTML =
      '<h1 class="' + (won ? 'win' : 'lose') + '">' + (won ? 'CITY SAVED' : 'CITY LOST') + '</h1>' +
      '<p>' + subtitle + '</p>' +
      '<p style="margin-top:20px; opacity:0.6;">Refresh the page to play again.</p>';
  }
}
