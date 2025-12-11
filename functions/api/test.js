// Redis Cloud REST API
// Использует формат: https://redis-endpoint/command/args

export async function onRequestGet(context) {
  const startTime = Date.now();
  const { REDIS_REST_URL, REDIS_REST_TOKEN } = context.env;

  // Проверка наличия переменных
  if (!REDIS_REST_URL || !REDIS_REST_TOKEN) {
    return new Response(JSON.stringify({ 
      status: "error", 
      message: "Missing REDIS_REST_URL or REDIS_REST_TOKEN",
      help: "Get these from Redis Cloud: Database → REST API section",
      example_url: "https://redis-12345.redislabs.com",
      example_token: "long-token-string"
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  // Получаем параметры из URL
  const url = new URL(context.request.url);
  const key = url.searchParams.get('key') || 'test:key';
  const command = url.searchParams.get('cmd') || 'ping';
  const value = url.searchParams.get('value');

  try {
    let requestUrl;
    let method = 'GET';

    // Формируем URL команды Redis в REST формате
    switch (command.toLowerCase()) {
      case 'ping':
        requestUrl = `${REDIS_REST_URL}/PING`;
        break;
      case 'get':
        requestUrl = `${REDIS_REST_URL}/GET/${encodeURIComponent(key)}`;
        break;
      case 'set':
        if (!value) {
          return new Response(JSON.stringify({ 
            status: "error", 
            message: "Value required for SET command",
            example: "/api/test?cmd=set&key=mykey&value=myvalue"
          }), { 
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
        requestUrl = `${REDIS_REST_URL}/SET/${encodeURIComponent(key)}/${encodeURIComponent(value)}`;
        break;
      case 'del':
      case 'delete':
        requestUrl = `${REDIS_REST_URL}/DEL/${encodeURIComponent(key)}`;
        break;
      case 'exists':
        requestUrl = `${REDIS_REST_URL}/EXISTS/${encodeURIComponent(key)}`;
        break;
      case 'ttl':
        requestUrl = `${REDIS_REST_URL}/TTL/${encodeURIComponent(key)}`;
        break;
      case 'keys':
        const pattern = url.searchParams.get('pattern') || '*';
        requestUrl = `${REDIS_REST_URL}/KEYS/${encodeURIComponent(pattern)}`;
        break;
      case 'incr':
        requestUrl = `${REDIS_REST_URL}/INCR/${encodeURIComponent(key)}`;
        break;
      case 'decr':
        requestUrl = `${REDIS_REST_URL}/DECR/${encodeURIComponent(key)}`;
        break;
      default:
        return new Response(JSON.stringify({ 
          status: "error", 
          message: `Unknown command: ${command}`,
          available: "ping, get, set, del, exists, ttl, keys, incr, decr"
        }), { 
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    }

    // Выполняем запрос к Redis Cloud REST API
    const response = await fetch(requestUrl, {
      method: method,
      headers: {
        'Authorization': `Bearer ${REDIS_REST_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    let redisData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      redisData = await response.json();
    } else {
      const textData = await response.text();
      redisData = { result: textData };
    }

    const endTime = Date.now();
    const latency = endTime - startTime;

    return new Response(JSON.stringify({
      status: response.ok ? "ok" : "error",
      latency_ms: latency,
      cold_start: latency > 500,
      ts: startTime,
      redis_status: response.ok ? "connected" : "error",
      http_status: response.status,
      command: {
        cmd: command,
        key: key,
        value: value || null
      },
      result: redisData.result !== undefined ? redisData.result : redisData,
      raw_response: !response.ok ? await response.text() : null
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });

  } catch (err) {
    const endTime = Date.now();
    return new Response(JSON.stringify({ 
      status: "error", 
      message: err.message,
      latency_ms: endTime - startTime,
      help: "Check REDIS_REST_URL format (should be https://redis-xxxxx.redislabs.com) and REDIS_REST_TOKEN"
    }), { 
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}