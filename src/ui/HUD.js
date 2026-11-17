export class HUD {
  constructor(root) {
    this.root = root;
    this.ammoPanel = document.createElement('div');
    this.ammoPanel.id = 'ammo-container';
    this.ammoPanel.innerHTML = `<div id="weapon-name">PISTOL</div><div id="ammo-count-container"><div id="ammo-current">30</div><div id="ammo-max">45</div></div>`;
    root.appendChild(this.ammoPanel);
    this.ammoCurrent = this.ammoPanel.querySelector('#ammo-current');
    this.ammoMax = this.ammoPanel.querySelector('#ammo-max');

    this.infectionPanel = document.createElement('div');
    this.infectionPanel.id = 'infection-panel';
    this.infectionPanel.innerHTML = `<div id="infection-label">CITY INFECTION</div><div id="infection-value">15.0%</div><div id="infection-warning">DANGER THRESHOLD</div>`;
    root.appendChild(this.infectionPanel);
    this.infectionValue = this.infectionPanel.querySelector('#infection-value');
    this.infectionWarning = this.infectionPanel.querySelector('#infection-warning');

    this.messageLog = document.createElement('div');
    this.messageLog.id = 'message-log';
    root.appendChild(this.messageLog);

    this.crosshair = document.createElement('div');
    this.crosshair.id = 'crosshair';
    root.appendChild(this.crosshair);

    this.hitmarker = document.createElement('div');
    this.hitmarker.id = 'hitmarker';
    root.appendChild(this.hitmarker);
  }

  updateAmmo(current, max = 45) {
    this.ammoCurrent.textContent = current;
    this.ammoMax.textContent = max;
    this.ammoCurrent.classList.toggle('low', current <= 6);
  }

  updateInfection(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    this.infectionValue.textContent = clamped.toFixed(1) + '%';
    if (clamped > 70) {
      this.infectionWarning.classList.add('show');
      this.infectionValue.style.color = '#ff4a4a';
    } else {
      this.infectionWarning.classList.remove('show');
      this.infectionValue.style.color = '#ffffff';
    }
  }

  setFocusMode(isAiming) {
    if (isAiming) this.crosshair.classList.add('focus-mode');
    else this.crosshair.classList.remove('focus-mode');
  }

  showMessage(text, type = 'neutral') {
    const m = document.createElement('div');
    m.className = 'msg ' + type;
    m.textContent = text;
    this.messageLog.appendChild(m);
    setTimeout(() => m.remove(), 3000);
  }

  triggerHitMarker() {
    this.hitmarker.classList.add('show');
    setTimeout(() => this.hitmarker.classList.remove('show'), 80);
  }

  triggerWin() {
    if (this.onWin) this.onWin();
  }
}
