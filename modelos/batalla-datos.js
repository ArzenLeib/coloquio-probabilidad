import mongoose from 'mongoose';

const batallanavalEsquema = new mongoose.Schema({
    juegoNumero: { type: Number, required: true },
    fecha: { type: Date, default: Date.now },
    movimientoNumero: { type: Number, required: true },
    posicion: {
        fila: { type: Number, required: true },
        col: { type: Number, required: true }
    },
    acierto: { type: Boolean, required: true },
    gano: { type: Boolean, required: true },
    dinero: { type: Number, required: true }
});

export default mongoose.models.batallanaval || mongoose.model('batallanaval', batallanavalEsquema);