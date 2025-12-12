// Быстрый ping без базы данных
// Просто проверка, что Worker работает

export async function onRequestGet() {
  const startTime = Date.now();
  
  // Небольшая задержка для имитации работы
  await new Promise(resolve => setTimeout(resolve, 1));
  
  const endTime = Date.now();
  const latency = endTime - startTime;

  return new Response(JSON.stringify({
    status: "ok",
    latency_ms: latency,
    ts: startTime,
    message: "Cloudflare Worker is alive",
    endpoint: "ping"
  }), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" 
    }
  });
}