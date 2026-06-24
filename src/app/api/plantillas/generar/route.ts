import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `Eres un asistente legal que genera plantillas de documentos. Basado en la siguiente descripción, genera una plantilla en HTML limpio, con espacios para los datos entre corchetes, por ejemplo [NOMBRE ARRENDATARIO]. No incluyas CSS, solo etiquetas HTML semánticas (<p>, <h2>, <ul>, etc.) y los placeholders. No uses variables tipo {{ }}. Devuelve solo el HTML de la plantilla.`;

export async function POST(req: Request) {
  try {
    const { descripcion } = await req.json();

    if (!descripcion || typeof descripcion !== 'string' || !descripcion.trim()) {
      return NextResponse.json(
        { error: 'La descripción es obligatoria' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('replace_') || apiKey.trim() === '') {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY no configurada en .env.local' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    const fullPrompt = `${SYSTEM_PROMPT}\n\nDescripción:\n${descripcion}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    });

    const response = result.response;
    let html = response.text();

    html = html.replace(/```html\s*/gi, '').replace(/```\s*$/g, '').trim();

    return NextResponse.json({ contenidoHtml: html });
  } catch (error: unknown) {
    console.error('Error generating template with Gemini:', error);
    return NextResponse.json(
      { error: (error as { message?: string }).message || 'Error al generar la plantilla con IA' },
      { status: 500 }
    );
  }
}
