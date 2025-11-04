import { Position } from './Position.js';

// Clase para representar un movimiento válido
export class Move {
    constructor(toRow, toCol, jumpRow, jumpCol) {
        this.to = new Position(toRow, toCol); //posición final a donde se mueve la pieza.
        this.jump = new Position(jumpRow, jumpCol); //posición de la pieza que se elimina al hacer el salto.
    }
    /*
    toRow → fila destino del movimiento.
    toCol → columna destino del movimiento.
    jumpRow → fila de la pieza que se va a saltar.
    jumpCol → columna de la pieza que se va a saltar.
    */
}