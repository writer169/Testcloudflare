
interface Env {
  MONGODB_API_URL: string;
  MONGODB_API_KEY: string;
  MONGODB_DATA_SOURCE: string;
  MONGODB_DATABASE: string;
  MONGODB_COLLECTION: string;
}

// Fix: Replaced 'PagesFunction<Env>' with an explicit function signature to resolve the "Cannot find name 'PagesFunction'" error
export const onRequestGet = async (context: { env: Env }): Promise<Response> => {
  const startTime = Date.now();
  const { 
    MONGODB_API_URL, 
    MONGODB_API_KEY, 
    MONGODB_DATA_SOURCE, 
    MONGODB_DATABASE, 
    MONGODB_COLLECTION 
  } = context.env;

  // Проверка наличия переменных
  if (!MONGODB_API_URL || !MONGODB_API_KEY) {
    return new Response(JSON.stringify({ 
      status: "error", 
      message: "Missing environment variables on Cloudflare side." 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const dbResponse = await fetch(MONGODB_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': MONGODB_API_KEY,
      },
      body: JSON.stringify({
        dataSource: MONGODB_DATA_SOURCE,
        database: MONGODB_DATABASE,
        collection: MONGODB_COLLECTION,
        filter: {} 
      })
    });

    // Note: dbData is retrieved but the current minimal response focuses on latency and connection status
    const dbData: any = await dbResponse.json();
    const endTime = Date.now();
    const latency = endTime - startTime;

    return new Response(JSON.stringify({
      status: "ok",
      latency_ms: latency,
      cold_start: latency > 500,
      ts: startTime,
      mongodb_status: dbResponse.status === 200 ? "connected" : "auth_error"
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ 
      status: "error", 
      message: err.message 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
