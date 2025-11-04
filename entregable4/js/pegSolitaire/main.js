import { PegSolitaire } from './PegSolitaire.js';

let game;
window.addEventListener('load', () => {
    game = new PegSolitaire('gameCanvas');
});