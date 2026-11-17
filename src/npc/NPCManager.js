import * as THREE from 'three';
import { NPC } from './NPC.js';

export class NPCManager {
  constructor(scene) {
    this.scene = scene;
    this.npcs = [];

    const spawnPoints = [
      new THREE.Vector3(-4, 1, 20),
      new THREE.Vector3(5, 1, 8),
      new THREE.Vector3(-6, 1, -10),
      new THREE.Vector3(7, 1, -25),
      new THREE.Vector3(-2, 1, 30),
    ];

    const infectedIndices = new Set([1, 3]);

    spawnPoints.forEach((p, i) => {
      this.npcs.push(new NPC(scene, i, infectedIndices.has(i), p));
    });
  }

  update(dt, playerPos, colliders) {
    for (const npc of this.npcs) {
      npc.update(dt, playerPos, this.npcs, colliders);
    }
  }

  getAliveNpcs() {
    return this.npcs.filter(n => n.alive);
  }

  getAliveInfectedCount() {
    return this.npcs.filter(n => n.alive && n.isInfected).length;
  }

  getAliveInnocentCount() {
    return this.npcs.filter(n => n.alive && !n.isInfected).length;
  }

  findNpcFromObject(obj) {
    let o = obj;
    while (o) {
      if (o.userData && o.userData.npc) return o.userData.npc;
      o = o.parent;
    }
    return null;
  }
}
