import dbConnect from '../../../lib/db';
import Juego from '../../../modelos/batalla-datos';
import { NextResponse } from 'next/server';

export async function GET() {
    await dbConnect();

    try {
        const juegos = await Juego.aggregate([
        {
            $group: {
            _id: "$juegoNumero", // Agrupa por juegoNumero
            jugadas: { $push: "$$ROOT" }, // Incluye todas las jugadas en el grupo
            },
        },
        { $sort: { _id: 1 } }, // Ordena los juegos por juegoNumero (opcional)
        ]);

        return NextResponse.json({ juegos }, { status: 200 });
    } catch (error) {
        console.error("Error al obtener los juegos:", error);
        return NextResponse.json({ error: "Error al obtener los juegos" }, { status: 500 });
    }
}

export async function POST(req) {
    
    await dbConnect();

    try {
        const { juegoNumero, movimientoNumero, posicion, acierto, gano, dinero } = await req.json();

        const juegoNuevo = new Juego({
            juegoNumero,
            movimientoNumero,
            posicion,
            acierto,
            gano,
            dinero
        });

        await juegoNuevo.save();
        return new Response(JSON.stringify({ message: 'Juego guardado exitosamente' }), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error al guardar el juego' }), { status: 500 });
    }
}