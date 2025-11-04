// Clase para manejar el temporizador
//iniciar, detener, reiniciar y formatear el tiempo restante.
export class GameTimer {
    constructor(initialTime, onTick, onExpire) {
        this.timeLeft = initialTime; //tiempo que queda en la cuenta regresiva.
        this.initialTime = initialTime; //tiempo inicial para reiniciar.
        this.onTick = onTick; //función que se llama cada segundo con el tiempo restante.
        this.onExpire = onExpire; //función que se llama cuando el tiempo llega a 0.
        this.interval = null; //referencia al setInterval para poder detenerlo más tarde.
    }

    start() {
        this.stop(); //// asegura que no haya otro intervalo corriendo
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.onTick(this.timeLeft);

            if (this.timeLeft <= 0) {
                this.stop();
                this.onExpire();
            }
        }, 1000); //restar 1 segundo cada 1000 ms.
    }

    stop() { //Detiene el temporizador cancelando el setInterval.
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    reset() { //Detiene el temporizador y reinicia el tiempo a su valor original.
        this.stop();
        this.timeLeft = this.initialTime;
    }

    getFormattedTime() {
        const minutes = Math.floor(this.timeLeft / 60); //calcula los minutos, % 60 los segundos.
        const seconds = this.timeLeft % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        //padStart(2, '0') asegura que siempre tenga dos dígitos
    }
}