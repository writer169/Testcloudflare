interface Env {
  REDIS_URL: string;
  REDIS_TOKEN: string;
}

export const onRequestGet = async (context: { 
  env: Env; 
  request: Request 
}): Promise<Response> => {
  const startTime = Date.now();
  const { REDIS_URL, REDIS_TOKEN } = context.env;

  // Проверка наличия переменных
  if (!REDIS_URL || !REDIS_TOKEN) {
    return new Response(JSON.stringify({ 
      status: "error", 
      message: "Missing REDIS_URL or REDIS_TOKEN environment variable" 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  // Получаем параметры из URL
  const url = new URL(context.request.url);
  const key = url.searchParams.get('key') || 'test:key';
  const command = url.searchParams.get('cmd') || 'get';
  const value = url.searchParams.get('value');

  try {
    let redisCommand = [];
    let response;

    // Формируем команду Redis в зависимости от параметра
    switch (command.toLowerCase()) {
      case 'get':
        redisCommand = ['GET', key];
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
        redisCommand = ['SET', key, value];
        break;
      case 'keys':
        const pattern = url.searchParams.get('pattern') || '*';
        redisCommand = ['KEYS', pattern];
        break;
      case 'ping':
        redisCommand = ['PING'];
        break;
      case 'info':
        redisCommand = ['INFO'];
        break;
      default:
        return new Response(JSON.stringify({ 
          status: "error", 
          message: `Unknown command: ${command}. Available: get, set, keys, ping, info`
        }), { 
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    }

    // Выполняем запрос к Upstash Redis REST API
    response = await fetch(`${REDIS_URL}/${redisCommand.join('/')}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${REDIS_TOKEN}`
      }
    });

    const redisData = await response.json();
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
      result: redisData.result !== undefined ? redisData.result : redisData,
      error: redisData.error || null
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });

  } catch (err: any) {
    const endTime = Date.now();
    return new Response(JSON.stringify({ 
      status: "error", 
      message: err.message,
      latency_ms: endTime - startTime
    }), { 
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};