export class HUD {
  constructor(root) {
    this.root = root;

    this.ammoPanel = document.createElement('div');
    this.ammoPanel.className = 'hud-panel';
    this.ammoPanel.id = 'ammo-panel';
    this.ammoPanel.innerHTML = '<div id="ammo-label">AMMUNITION</div><div id="ammo-value">30</div>';
    root.appendChild(this.ammoPanel);
    this.ammoValue = this.ammoPanel.querySelector('#ammo-value');

    this.infectionPanel = document.createElement('div');
    this.infectionPanel.className = 'hud-panel';
    this.infectionPanel.id = 'infection-panel';
    this.infectionPanel.innerHTML =
      '<div id="infection-label">CITY INFECTION</div>' +
      '<div id="infection-bar-outer"><div id="infection-bar-inner"></div></div>' +
      '<div id="infection-value">15%</div>';
    root.appendChild(this.infectionPanel);
    this.infectionBar = this.infectionPanel.querySelector('#infection-bar-inner');
    this.infectionValue = this.infectionPanel.querySelector('#infection-value');

    this.messageLog = document.createElement('div');
    this.messageLog.id = 'message-log';
    root.appendChild(this.messageLog);

    this.crosshair = document.createElement('div');
    this.crosshair.id = 'crosshair';
    this.crosshair.innerHTML = '<div class="h l"></div><div class="h r"></div>';
    root.appendChild(this.crosshair);
  }

  updateAmmo(n) {
    this.ammoValue.textContent = n;
    this.ammoValue.classList.toggle('low', n <= 6);
  }

  updateInfection(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    this.infectionBar.style.width = clamped + '%';
    this.infectionValue.textContent = clamped.toFixed(1) + '%';
  }

  showMessage(text, type = 'neutral') {
    const m = document.createElement('div');
    m.className = 'msg ' + type;
    m.textContent = text;
    this.messageLog.appendChild(m);
    setTimeout(() => m.remove(), 3400);
  }

  triggerWin() {
    if (this.onWin) this.onWin();
  }
}
