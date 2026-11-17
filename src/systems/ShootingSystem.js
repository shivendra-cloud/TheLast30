import * as THREE from 'three';

export class ShootingSystem {
  constructor(scene, camera, npcManager, hud, infectionSystem) {
    this.scene = scene;
    this.camera = camera;
    this.npcManager = npcManager;
    this.hud = hud;
    this.infectionSystem = infectionSystem;
    this.raycaster = new THREE.Raycaster();
    this.ammo = 30;
    this.maxAmmo = 45;
  }

  canFire() {
    return this.ammo > 0;
  }

  fire() {
    this.ammo -= 1;
    this.hud.updateAmmo(this.ammo);

    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);

    const aliveNpcs = this.npcManager.getAliveNpcs();
    const objects = aliveNpcs.map(n => n.group);

    const hits = this.raycaster.intersectObjects(objects, true);
    let result = { hitNpc: null, point: null };

    if (hits.length > 0) {
      const hit = hits[0];
      const npc = this.npcManager.findNpcFromObject(hit.object);
      result.hitNpc = npc;
      result.point = hit.point;

      if (npc) {
        this.resolveKill(npc);
      }
    } else {
      const far = this.raycaster.ray.at(80, new THREE.Vector3());
      result.point = far;
    }

    if (this.ammo <= 0) {
      this.hud.showMessage('OUT OF AMMUNITION', 'bad');
    }

    return result;
  }

  resolveKill(npc) {
    npc.kill();

    if (npc.isInfected) {
      this.ammo = Math.min(this.maxAmmo, this.ammo + 6);
      this.infectionSystem.onCorrectKill();
      this.hud.updateAmmo(this.ammo);
      this.hud.showMessage('INFECTED ELIMINATED  +6', 'good');
    } else {
      this.ammo = Math.max(0, this.ammo - 12);
      this.infectionSystem.onInnocentKill();
      this.hud.updateAmmo(this.ammo);
      this.hud.showMessage('INNOCENT KILLED  -12', 'bad');
    }

    const infectedLeft = this.npcManager.getAliveInfectedCount();
    if (infectedLeft === 0) {
      this.hud.triggerWin();
    }
  }
}
