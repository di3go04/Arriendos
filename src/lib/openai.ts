export async function generateWithOpenAI(prompt: string, system?: string) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey || apiKey === 'your_openai_api_key') {
    return simulateAIResponse(prompt)
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: system || 'Eres un asistente experto en bienes raíces y arrendamientos.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })

  if (!res.ok) {
    console.error('OpenAI API error:', await res.text())
    return simulateAIResponse(prompt)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

function simulateAIResponse(prompt: string): string {
  if (prompt.toLowerCase().includes('descripci')) {
    return 'Amplio apartamento de 80m² en el corazón de la ciudad. Disfruta de vistas panorámicas, acabados de lujo y una ubicación privilegiada cerca de los principales centros comerciales y financieros. Cuenta con 3 habitaciones, 2 baños, cocina integral abierta, balcón privado y parqueadero incluido. Ideal para familias que buscan confort y estilo de vida urbano.'
  }
  if (prompt.toLowerCase().includes('contrato') || prompt.toLowerCase().includes('cláusula')) {
    return 'De acuerdo con el contrato de arrendamiento, la cláusula de penalización por mora establece un cargo del 0.5% diario sobre el canon de arrendamiento, aplicable a partir del día siguiente a la fecha de vencimiento. El depósito de garantía equivale a un mes de canon y será devuelto al finalizar el contrato, previa deducción de cualquier obligación pendiente.'
  }
  if (prompt.toLowerCase().includes('recomienda') || prompt.toLowerCase().includes('similar')) {
    return 'Basado en tus preferencias de búsqueda y propiedades visitadas, te recomiendo explorar propiedades en la misma zona con características similares: rango de precio, número de habitaciones y amenities.'
  }
  return 'Procesando tu solicitud con IA. Los resultados se mostrarán en breve.'
}

export async function generatePropertyDescription(property: {
  title: string
  type: string
  city: string
  area?: number | null
  rooms?: number
  amenities?: string[]
}) {
  const prompt = `Genera una descripción profesional y atractiva para esta propiedad de alquiler:
- Título: ${property.title}
- Tipo: ${property.type}
- Ciudad: ${property.city}
- Área: ${property.area || 'No especificada'} m²
- Habitaciones: ${property.rooms || 'No especificado'}
- Amenities: ${(property.amenities || []).join(', ') || 'No especificados'}

La descripción debe ser en español, optimizada para SEO, con un tono profesional y atractivo. Máximo 150 palabras.`

  return generateWithOpenAI(prompt, 'Eres un copywriter experto en bienes raíces.')
}

export async function answerDocumentQuestion(documentText: string, question: string) {
  const prompt = `Basado en el siguiente documento legal, responde la pregunta del usuario:

DOCUMENTO:
${documentText.slice(0, 4000)}

PREGUNTA: ${question}

Responde de manera clara y precisa, citando las cláusulas relevantes si aplica.`

  return generateWithOpenAI(prompt, 'Eres un abogado experto en derecho inmobiliario y contratos de arrendamiento.')
}
