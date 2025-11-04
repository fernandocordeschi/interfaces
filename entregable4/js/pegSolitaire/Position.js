// Clase para representar una posición en el tablero
//útil para juegos tipo "tablero" donde necesitas saber dónde está cada elemento.
export class Position {
    constructor(row, col) {
        this.row = row;
        this.col = col;
    }

    equals(other) { //comparar dos posiciones para ver si son iguales.
        return this.row === other.row && this.col === other.col; //true si la fila y la columna coinciden, false si no.
    }
}