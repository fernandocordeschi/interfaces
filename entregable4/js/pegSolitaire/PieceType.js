// Clase para manejar los tipos de fichas
export class PieceType { //plantilla para crear objetos que representan tipos de fichas en el juego. serían las piezas del tablero
    constructor(colors, glow, name, imagePath) {
        this.colors = colors; //guarda los colores del fichas.
        this.glow = glow; //guarda el color del resplandor.
        this.name = name;
        this.imagePath = imagePath;
        this.image = null; //inicialmente null; más adelante se usará para almacenar el objeto Image
        this.imageLoaded = false;
        //Cada "tipo de fichas" tiene colores, un efecto de resplandor, un nombre y opcionalmente una imagen.

        // Cargar imagen si se proporciona una ruta
        if (imagePath) {
            this.image = new Image();
            this.image.onload = () => {
                this.imageLoaded = true;
            };
            this.image.src = imagePath;
        }
    }
}