// Простой ping endpoint без авторизации
// Для быстрой проверки работоспособности Worker

export async function onRequestGet() {
  return new Response(JSON.stringify({
    status: "ok",
    message: "Cloudflare Worker is alive",
    endpoint: "ping",
    timestamp: new Date().toISOString()
  }), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" 
    }
  });
}