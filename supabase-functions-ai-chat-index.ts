import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "Falta configurar GEMINI_API_KEY como secreto de la función en Supabase."
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const message = String(body?.message || "").trim().slice(0, 1000);
    if (!message) {
      return new Response(JSON.stringify({ error: "Escribe un mensaje." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemInstruction = [
      "Eres el asistente virtual del portafolio académico FRANK.DEV, de Frank de la Cruz Sierra.",
      "Responde en español, con amabilidad y claridad.",
      "Ayuda con navegación por el portafolio, actividades de Algoritmos y Desarrollo de Aplicaciones, proyectos, perfil académico y enlaces.",
      "No inventes datos específicos que no se te hayan proporcionado.",
      "Nunca solicites contraseñas, DNI, claves API ni datos sensibles.",
      "Si te preguntan algo que no conoces del portafolio, dilo con honestidad."
    ].join(" ");

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [{
            role: "user",
            parts: [{ text: message }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      }
    );

    const result = await response.json();
    if (!response.ok) {
      console.error("Gemini API error", response.status, result);
      return new Response(JSON.stringify({
        error: "Gemini no pudo responder. Revisa la clave, el modelo y la cuota de tu proyecto."
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reply = result?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return new Response(JSON.stringify({
        error: "Gemini no devolvió una respuesta. Intenta nuevamente."
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-chat error", error);
    return new Response(JSON.stringify({
      error: "No se pudo procesar el mensaje. Intenta nuevamente."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
