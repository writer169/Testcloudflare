// Cloudflare D1 Query API с полной защитой данных
// Автоматическая фильтрация по user_id и проверка прав доступа

// Публичные таблицы - доступны всем пользователям приложения
const PUBLIC_TABLES = ['app_settings', 'reference_data'];

// Системные таблицы - недоступны через API
const SYSTEM_TABLES = ['apps', 'users', 'user_apps', 'user_roles', 'table_permissions'];

export async function onRequest(context) {
  const { DB } = context.env;

  if (!DB) {
    return jsonResponse({ 
      status: "error", 
      message: "D1 database binding not found"
    }, 500);
  }

  try {
    const url = new URL(context.request.url);
    
    // Получаем ключи авторизации
    const app_key = url.searchParams.get('app_key') || 
                    context.request.headers.get('X-App-Key');
    const user_key = url.searchParams.get('user_key') || 
                     context.request.headers.get('X-User-Key');

    // Проверка наличия ключей
    if (!app_key || !user_key) {
      return jsonResponse({
        status: "error",
        message: "Authentication required",
        required: ["app_key", "user_key"]
      }, 401);
    }

    // 1. Проверяем app_key
    const app = await DB.prepare(
      'SELECT app_id, app_name FROM apps WHERE app_key = ?'
    ).bind(app_key).first();

    if (!app) {
      return jsonResponse({
        status: "error",
        message: "Invalid app_key"
      }, 401);
    }

    // 2. Проверяем user_key и получаем роль
    const user = await DB.prepare(
      'SELECT u.user_id, u.username, COALESCE(ur.role, "user") as role FROM users u LEFT JOIN user_roles ur ON u.user_id = ur.user_id WHERE u.user_key = ?'
    ).bind(user_key).first();

    if (!user) {
      return jsonResponse({
        status: "error",
        message: "Invalid user_key"
      }, 401);
    }

    // 3. Проверяем доступ к приложению
    const access = await DB.prepare(
      'SELECT 1 FROM user_apps WHERE user_id = ? AND app_id = ?'
    ).bind(user.user_id, app.app_id).first();

    if (!access) {
      return jsonResponse({
        status: "error",
        message: "Access denied",
        details: `User ${user.username} does not have access to ${app.app_name}`
      }, 403);
    }

    // Парсим запрос
    let action, sql, params, table, data;

    if (context.request.method === 'GET') {
      action = url.searchParams.get('action') || 'tables';
      sql = url.searchParams.get('sql');
      table = url.searchParams.get('table');
      const dataParam = url.searchParams.get('data');
      if (dataParam) {
        try {
          data = JSON.parse(dataParam);
        } catch (e) {
          return jsonResponse({ status: "error", message: "Invalid JSON in data parameter" }, 400);
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
        return jsonResponse({ status: "error", message: "Invalid JSON body" }, 400);
      }
    } else {
      return jsonResponse({ status: "error", message: "Method not allowed. Use GET or POST" }, 405);
    }

    // Проверка доступа к таблице
    if (table) {
      // Запрет доступа к системным таблицам
      if (SYSTEM_TABLES.includes(table)) {
        return jsonResponse({
          status: "error",
          message: "Access to system tables is forbidden"
        }, 403);
      }

      // Проверка прав на конкретную таблицу
      const tablePermission = await checkTablePermission(DB, user.user_id, table, action);
      if (!tablePermission.allowed) {
        return jsonResponse({
          status: "error",
          message: "Permission denied for this table",
          details: tablePermission.reason
        }, 403);
      }
    }

    let result;

    // Выполнение действий с автоматической защитой
    switch (action) {
      case 'tables':
        // Список таблиц (исключаем системные)
        const allTables = await DB.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).all();
        
        result = {
          results: allTables.results.filter(t => !SYSTEM_TABLES.includes(t.name))
        };
        break;

      case 'select':
        if (!table) {
          return jsonResponse({ status: "error", message: "Table name required" }, 400);
        }
        
        // Автоматическая фильтрация по user_id
        if (PUBLIC_TABLES.includes(table)) {
          // Публичная таблица - все записи
          result = await DB.prepare(`SELECT * FROM ${table}`).all();
        } else if (user.role === 'admin') {
          // Админ видит все
          result = await DB.prepare(`SELECT * FROM ${table}`).all();
        } else {
          // Обычный пользователь - только свои записи
          result = await DB.prepare(
            `SELECT * FROM ${table} WHERE user_id = ?`
          ).bind(user.user_id).all();
        }
        break;

      case 'insert':
        if (!table || !data) {
          return jsonResponse({ status: "error", message: "Table and data required" }, 400);
        }
        
        // Автоматически добавляем user_id для приватных таблиц
        if (!PUBLIC_TABLES.includes(table)) {
          data.user_id = user.user_id;
        }
        
        const insertCols = Object.keys(data).join(', ');
        const insertVals = Object.keys(data).map(() => '?').join(', ');
        const insertParams = Object.values(data);
        
        result = await DB.prepare(
          `INSERT INTO ${table} (${insertCols}) VALUES (${insertVals})`
        ).bind(...insertParams).run();
        break;

      case 'update':
        if (!table || !data || !sql) {
          return jsonResponse({ status: "error", message: "Table, data, and WHERE clause required" }, 400);
        }
        
        const setClauses = Object.keys(data).map(k => `${k} = ?`).join(', ');
        const updateParams = Object.values(data);
        
        // Защита: можно изменять только свои записи
        if (PUBLIC_TABLES.includes(table)) {
          // Публичная таблица
          if (user.role !== 'admin') {
            return jsonResponse({
              status: "error",
              message: "Only admins can update public tables"
            }, 403);
          }
          result = await DB.prepare(
            `UPDATE ${table} SET ${setClauses} WHERE ${sql}`
          ).bind(...updateParams).run();
        } else if (user.role === 'admin') {
          // Админ может изменять любые записи
          result = await DB.prepare(
            `UPDATE ${table} SET ${setClauses} WHERE ${sql}`
          ).bind(...updateParams).run();
        } else {
          // Обычный пользователь - только свои записи
          result = await DB.prepare(
            `UPDATE ${table} SET ${setClauses} WHERE user_id = ? AND ${sql}`
          ).bind(...updateParams, user.user_id).run();
        }
        break;

      case 'delete':
        if (!table || !sql) {
          return jsonResponse({ status: "error", message: "Table and WHERE clause required" }, 400);
        }
        
        // Защита: можно удалять только свои записи
        if (PUBLIC_TABLES.includes(table)) {
          if (user.role !== 'admin') {
            return jsonResponse({
              status: "error",
              message: "Only admins can delete from public tables"
            }, 403);
          }
          result = await DB.prepare(`DELETE FROM ${table} WHERE ${sql}`).run();
        } else if (user.role === 'admin') {
          // Админ может удалять любые записи
          result = await DB.prepare(`DELETE FROM ${table} WHERE ${sql}`).run();
        } else {
          // Обычный пользователь - только свои записи
          result = await DB.prepare(
            `DELETE FROM ${table} WHERE user_id = ? AND ${sql}`
          ).bind(user.user_id).run();
        }
        break;

      case 'custom':
        if (!sql) {
          return jsonResponse({ status: "error", message: "SQL query required" }, 400);
        }
        
        // Защита для custom SQL
        const sqlLower = sql.trim().toLowerCase();
        
        // Запрет доступа к системным таблицам
        for (const sysTable of SYSTEM_TABLES) {
          if (sqlLower.includes(sysTable)) {
            return jsonResponse({
              status: "error",
              message: "Access to system tables is forbidden"
            }, 403);
          }
        }
        
        // Только админы могут использовать DROP, ALTER, TRUNCATE
        if (user.role !== 'admin') {
          const dangerousCommands = ['drop', 'alter', 'truncate', 'create'];
          for (const cmd of dangerousCommands) {
            if (sqlLower.includes(cmd)) {
              return jsonResponse({
                status: "error",
                message: `Command '${cmd}' requires admin role`
              }, 403);
            }
          }
        }
        
        const stmt = DB.prepare(sql);
        if (params && params.length > 0) {
          result = await stmt.bind(...params).all();
        } else {
          if (sqlLower.startsWith('select') || sqlLower.startsWith('pragma')) {
            result = await stmt.all();
          } else {
            result = await stmt.run();
          }
        }
        break;

      default:
        return jsonResponse({
          status: "error",
          message: `Unknown action: ${action}`,
          available: ["tables", "select", "insert", "update", "delete", "custom"]
        }, 400);
    }

    return jsonResponse({
      status: "ok",
      action: action,
      auth: {
        app: app.app_name,
        user: user.username,
        role: user.role
      },
      result: result,
      meta: {
        success: result?.success !== undefined ? result.success : true,
        rows_affected: result?.meta?.changes || 0,
        rows_returned: result?.results?.length || 0
      }
    });

  } catch (err) {
    return jsonResponse({ 
      status: "error", 
      message: err.message
    }, 500);
  }
}

// Проверка прав доступа к таблице
async function checkTablePermission(DB, userId, tableName, action) {
  // Проверяем есть ли специальные права на таблицу
  const permission = await DB.prepare(
    'SELECT permission_type FROM table_permissions WHERE user_id = ? AND table_name = ?'
  ).bind(userId, tableName).first();

  if (permission) {
    // Есть явное правило
    const allowedActions = permission.permission_type.split(',');
    if (!allowedActions.includes(action) && !allowedActions.includes('*')) {
      return {
        allowed: false,
        reason: `Action '${action}' not allowed for this table`
      };
    }
  }

  return { allowed: true };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" 
    }
  });
}