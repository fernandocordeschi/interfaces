// Clase para representar un botón
export class Button {
    constructor(x, y, width, height, text, callback) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.callback = callback;
        this.isHovered = false;
    }


    /*Recibe coordenadas (x, y) de un punto (por ejemplo, la posición del mouse).
        Retorna true si el punto está dentro del botón, false si no.
        Esto sirve para detectar hover o clics.
    */
    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
            y >= this.y && y <= this.y + this.height;
    }

    draw(ctx) {
        // Sombra
        /**
         * Cambia la sombra dependiendo si el cursor está encima (hover).
        */
        if (this.isHovered) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(255, 165, 0, 0.6)';
        } else {
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(255, 165, 0, 0.3)';
        }

        // Fondo del botón estilo Los Simpson (amarillo a naranja)
        //degradado vertical para el fondo del botón: amarillo arriba, naranja abajo.
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#FDD017');
        gradient.addColorStop(1, '#FF8C00');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Borde negro
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.shadowBlur = 0;

        // Texto
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
    }

    click() {
        if (this.callback) {
            this.callback();
        }
    }
}