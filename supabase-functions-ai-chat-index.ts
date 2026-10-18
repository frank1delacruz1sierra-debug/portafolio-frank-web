import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.77.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Método no permitido" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("Falta configurar OPENAI_API_KEY en los secretos de Supabase.");
    const body = await req.json();
    const message = String(body?.message || "").trim().slice(0, 1000);
    if (!message) return new Response(JSON.stringify({ error: "Escribe un mensaje." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres el asistente virtual del portafolio académico Frank.Dev, de Frank de la Cruz Sierra. Ayuda en español con navegación por el portafolio, actividades de Algoritmos y Desarrollo de Aplicaciones. Sé amable y conciso. No afirmes conocer información específica del sitio si no se te ha proporcionado. Nunca solicites contraseñas, DNI ni datos sensibles." },
        { role: "user", content: message }
      ],
      max_tokens: 450,
    });
    const reply = completion.choices[0]?.message?.content || "No pude generar una respuesta en este momento.";
    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("ai-chat error", error);
    return new Response(JSON.stringify({ error: "No se pudo procesar el mensaje." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
