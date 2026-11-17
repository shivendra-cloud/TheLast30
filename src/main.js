import './style.css';
import { GameManager } from './systems/GameManager.js';

const container = document.getElementById('app');
const game = new GameManager(container);
game.start();
