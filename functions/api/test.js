// Redis тест с Redis Cloud REST API

export async function onRequestGet(context) {
  const startTime = Date.now();
  const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = context.env;

  // Проверка наличия переменных
  if (!REDIS_HOST || !REDIS_PASSWORD) {
    return new Response(JSON.stringify({ 
      status: "error", 
      message: "Missing REDIS_HOST or REDIS_PASSWORD environment variable",
      help: "Add them in Cloudflare Pages: Settings → Functions → Environment Variables"
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
  const port = REDIS_PORT || '6379';

  try {
    let redisCommand = [];
    let redisArgs = [];

    // Формируем команду Redis
    switch (command.toLowerCase()) {
      case 'get':
        redisCommand = 'GET';
        redisArgs = [key];
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
        redisCommand = 'SET';
        redisArgs = [key, value];
        break;
      case 'keys':
        const pattern = url.searchParams.get('pattern') || '*';
        redisCommand = 'KEYS';
        redisArgs = [pattern];
        break;
      case 'ping':
        redisCommand = 'PING';
        redisArgs = [];
        break;
      case 'info':
        redisCommand = 'INFO';
        redisArgs = [];
        break;
      case 'del':
      case 'delete':
        redisCommand = 'DEL';
        redisArgs = [key];
        break;
      case 'exists':
        redisCommand = 'EXISTS';
        redisArgs = [key];
        break;
      case 'ttl':
        redisCommand = 'TTL';
        redisArgs = [key];
        break;
      default:
        return new Response(JSON.stringify({ 
          status: "error", 
          message: `Unknown command: ${command}`,
          available: "ping, get, set, del, exists, ttl, keys, info"
        }), { 
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    }

    // Используем Redis REST API (если доступен) или прямое подключение через HTTP proxy
    // Для Redis Cloud нужно использовать их REST API endpoint
    const restApiUrl = `https://${REDIS_HOST}`;
    
    // Формируем тело запроса в формате Redis Protocol (RESP)
    const requestBody = [redisCommand, ...redisArgs];
    
    const response = await fetch(restApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${REDIS_PASSWORD}`
      },
      body: JSON.stringify(requestBody)
    });

    let redisData;
    try {
      redisData = await response.json();
    } catch {
      redisData = await response.text();
    }

    const endTime = Date.now();
    const latency = endTime - startTime;

    return new Response(JSON.stringify({
      status: response.ok ? "ok" : "error",
      latency_ms: latency,
      cold_start: latency > 500,
      ts: startTime,
      redis_status: response.ok ? "connected" : "error",
      command: {
        cmd: command,
        key: key,
        value: value || null
      },
      result: redisData,
      http_status: response.status,
      note: "Redis Cloud requires REST API to be enabled in database settings"
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
      help: "Make sure Redis Cloud REST API is enabled for your database"
    }), { 
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}