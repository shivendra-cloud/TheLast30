import * as THREE from 'three';
import { World } from '../world/World.js';
import CoastalCityMap from '../world/CoastalCityMap.js';
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
    this.map = new CoastalCityMap(this.scene);
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 250);
    this.world.activeCamera = this.camera;
    
    this.input = new InputManager();
    this.player = new Player(this.scene);
    this.player.group.visible = false;
    this.cameraCtrl = new CameraController(this.camera, this.input);
    this.weapon = new Weapon(this.scene, this.camera);
    this.npcManager = new NPCManager(this.scene);
    this.infectionSystem = new InfectionSystem(this.npcManager);

    this.uiRoot = document.createElement('div');
    this.uiRoot.id = 'hud';
    container.appendChild(this.uiRoot);
    this.hud = new HUD(this.uiRoot);
    this.shooting = new ShootingSystem(this.scene, this.camera, this.npcManager, this.hud, this.infectionSystem);

    this.overlay = document.createElement('div');
    this.overlay.id = 'overlay';
    this.overlay.innerHTML = '<h1>THE LAST 30</h1><p>CLICK TO START</p>';
    container.appendChild(this.overlay);
    this.overlay.addEventListener('click', () => {
      this.overlay.classList.add('hidden');
      this.input.lockPointer();
      this.started = true;
    });

    this.gameover = document.createElement('div');
    this.gameover.id = 'gameover';
    container.appendChild(this.gameover);
    this.hud.onWin = () => this.endGame(true);
    this.gameOverActive = false;
    this.clock = new THREE.Clock();
  }

  start() {
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  loop() {
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.started && !this.gameOverActive) {
      if (this.input.consumeShoot() && this.shooting.canFire() && this.weapon.canFire()) {
        const result = this.shooting.fire();
        if (result.point) this.weapon.fire(result.point);
      }
      const isAiming = this.input.isAiming();
      this.hud.setFocusMode(isAiming);
      this.player.update(dt, this.input, this.cameraCtrl.yaw, this.map.colliders, this.cameraCtrl.pitch);
      this.npcManager.update(dt, this.player.position, this.map.colliders);
      this.infectionSystem.update(dt);
      this.cameraCtrl.update(dt, this.player, this.map.colliders);
      const isMoving =
        this.input.keys['KeyW'] ||
        this.input.keys['KeyA'] ||
        this.input.keys['KeyS'] ||
        this.input.keys['KeyD'];

      this.weapon.update(dt, isAiming, isMoving);
      this.hud.updateInfection(this.infectionSystem.infectionPct);
      if (this.infectionSystem.lost) this.endGame(false);
    } else {
      this.camera.position.set(0, 6, 18);
      this.camera.lookAt(0, 1, 0);
    }
    this.world.render();
    requestAnimationFrame(this.loop);
  }

  endGame(won) {
    this.gameOverActive = true;
    document.exitPointerLock?.();
    this.gameover.classList.add('show');
    this.gameover.innerHTML = '<h1>' + (won ? 'CITY SAVED' : 'CITY LOST') + '</h1><p>REFRESH TO TRY AGAIN</p>';
  }
}
