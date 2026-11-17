export class InfectionSystem {
  constructor(npcManager) {
    this.npcManager = npcManager;
    this.infectionPct = 15;
    this.spreadRate = 0.35;
    this.lost = false;
  }

  update(dt) {
    if (this.lost) return;

    const infectedAlive = this.npcManager.getAliveInfectedCount();
    if (infectedAlive > 0) {
      this.infectionPct += this.spreadRate * dt * (0.5 + infectedAlive * 0.35);

      const infected = this.npcManager.npcs.filter(n => n.alive && n.isInfected);
      const innocent = this.npcManager.npcs.filter(n => n.alive && !n.isInfected);
      for (const inf of infected) {
        for (const inn of innocent) {
          const dx = inf.position.x - inn.position.x;
          const dz = inf.position.z - inn.position.z;
          if (dx * dx + dz * dz < 4.0) {
            this.infectionPct += 0.6 * dt;
          }
        }
      }
    }

    if (this.infectionPct >= 100) {
      this.infectionPct = 100;
      this.lost = true;
    }
  }

  onCorrectKill() {
    this.infectionPct = Math.max(0, this.infectionPct - 6);
  }

  onInnocentKill() {
    this.infectionPct = Math.min(100, this.infectionPct + 3);
  }
}
