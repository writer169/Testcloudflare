// Cloudflare D1 Query API
// Поддерживает GET и POST запросы для работы с D1 базой данных

export async function onRequest(context) {
  const startTime = Date.now();
  const { DB } = context.env;

  // Проверка наличия D1 binding
  if (!DB) {
    return new Response(JSON.stringify({ 
      status: "error", 
      message: "D1 database binding not found",
      help: "Add D1 binding in Cloudflare Dashboard: Settings → Functions → D1 database bindings",
      required_binding: "Variable name: DB, Database: ursa"
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  try {
    const url = new URL(context.request.url);
    let action, sql, params, table, data;

    // Обработка GET и POST запросов
    if (context.request.method === 'GET') {
      action = url.searchParams.get('action') || 'tables';
      sql = url.searchParams.get('sql');
      table = url.searchParams.get('table');
      const dataParam = url.searchParams.get('data');
      if (dataParam) {
        try {
          data = JSON.parse(dataParam);
        } catch (e) {
          return errorResponse("Invalid JSON in data parameter", 400);
        }
      }
    } else if (context.request.method === 'POST') {
      try {
        const body = await context.request.json();
        action = body.action;
        sql = body.sql;
        params = body.params || [];
        table = body.table;
        data = body.data;
      } catch (e) {
        return errorResponse("Invalid JSON body", 400);
      }
    } else {
      return errorResponse("Method not allowed. Use GET or POST", 405);
    }

    let result;

    // Выполнение действий
    switch (action) {
      case 'tables':
        // Получить список всех таблиц
        result = await DB.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).all();
        break;

      case 'select':
        // Выбрать все записи из таблицы
        if (!table) {
          return errorResponse("Table name required for select action", 400);
        }
        result = await DB.prepare(`SELECT * FROM ${table}`).all();
        break;

      case 'insert':
        // Вставить запись в таблицу
        if (!table || !data) {
          return errorResponse("Table name and data required for insert", 400);
        }
        const insertCols = Object.keys(data).join(', ');
        const insertVals = Object.keys(data).map(() => '?').join(', ');
        const insertParams = Object.values(data);
        result = await DB.prepare(
          `INSERT INTO ${table} (${insertCols}) VALUES (${insertVals})`
        ).bind(...insertParams).run();
        break;

      case 'update':
        // Обновить записи в таблице
        if (!table || !data || !sql) {
          return errorResponse("Table, data, and WHERE clause (sql) required", 400);
        }
        const setClauses = Object.keys(data).map(k => `${k} = ?`).join(', ');
        const updateParams = Object.values(data);
        result = await DB.prepare(
          `UPDATE ${table} SET ${setClauses} WHERE ${sql}`
        ).bind(...updateParams).run();
        break;

      case 'delete':
        // Удалить записи из таблицы
        if (!table || !sql) {
          return errorResponse("Table and WHERE clause (sql) required", 400);
        }
        result = await DB.prepare(`DELETE FROM ${table} WHERE ${sql}`).run();
        break;

      case 'custom':
        // Выполнить произвольный SQL запрос
        if (!sql) {
          return errorResponse("SQL query required for custom action", 400);
        }
        const stmt = DB.prepare(sql);
        if (params && params.length > 0) {
          result = await stmt.bind(...params).all();
        } else {
          // Определяем тип запроса
          const sqlLower = sql.trim().toLowerCase();
          if (sqlLower.startsWith('select') || sqlLower.startsWith('pragma')) {
            result = await stmt.all();
          } else {
            result = await stmt.run();
          }
        }
        break;

      default:
        return errorResponse(
          `Unknown action: ${action}. Available: tables, select, insert, update, delete, custom`,
          400
        );
    }

    const endTime = Date.now();
    const latency = endTime - startTime;

    return new Response(JSON.stringify({
      status: "ok",
      latency_ms: latency,
      ts: startTime,
      action: action,
      result: result,
      meta: {
        success: result?.success !== undefined ? result.success : true,
        rows_affected: result?.meta?.changes || 0,
        rows_returned: result?.results?.length || 0
      }
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
      help: "Check your SQL query syntax and D1 binding configuration"
    }), { 
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ 
    status: "error", 
    message: message
  }), { 
    status: status,
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}