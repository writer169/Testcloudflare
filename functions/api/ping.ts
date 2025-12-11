// Этот эндпоинт не требует переменных окружения
// Просто быстрый ответ для проверки, что Worker работает

export const onRequestGet = async (): Promise<Response> => {
  const startTime = Date.now();
  
  // Небольшая задержка для имитации реальной работы
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
};