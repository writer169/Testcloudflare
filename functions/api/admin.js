// Admin API для управления приложениями, пользователями и ролями
// Защищено мастер-ключом из переменных окружения

export async function onRequest(context) {
  const { DB, ADMIN_SECRET } = context.env;
  
  // Проверка мастер-ключа
  const authHeader = context.request.headers.get('Authorization');
  const providedKey = authHeader?.replace('Bearer ', '');
  
  if (!ADMIN_SECRET || providedKey !== ADMIN_SECRET) {
    return jsonResponse({ status: 'error', message: 'Unauthorized' }, 401);
  }

  if (!DB) {
    return jsonResponse({ status: 'error', message: 'D1 binding not found' }, 500);
  }

  try {
    const body = await context.request.json();
    const { action } = body;

    switch (action) {
      case 'verify':
        return jsonResponse({ status: 'ok', message: 'Authenticated' });

      case 'list_apps':
        const apps = await DB.prepare('SELECT * FROM apps ORDER BY created_at DESC').all();
        return jsonResponse({ status: 'ok', data: apps.results });

      case 'list_users':
        // Получаем пользователей с ролями
        const users = await DB.prepare(`
          SELECT u.*, COALESCE(ur.role, 'user') as role 
          FROM users u 
          LEFT JOIN user_roles ur ON u.user_id = ur.user_id 
          ORDER BY u.created_at DESC
        `).all();
        return jsonResponse({ status: 'ok', data: users.results });

      case 'list_user_apps':
        const userApps = await DB.prepare('SELECT * FROM user_apps').all();
        return jsonResponse({ status: 'ok', data: userApps.results });

      case 'register_app':
        const { app_id, app_name } = body;
        
        if (!app_id || !app_name) {
          return jsonResponse({ status: 'error', message: 'app_id and app_name required' }, 400);
        }

        const existingApp = await DB.prepare('SELECT 1 FROM apps WHERE app_id = ?').bind(app_id).first();
        if (existingApp) {
          return jsonResponse({ status: 'error', message: 'App ID already exists' }, 400);
        }

        const app_key = 'tk_' + generateRandomKey(32);
        
        await DB.prepare(
          'INSERT INTO apps (app_id, app_key, app_name, created_at) VALUES (?, ?, ?, datetime("now"))'
        ).bind(app_id, app_key, app_name).run();

        return jsonResponse({ 
          status: 'ok', 
          app_id, 
          app_key,
          message: 'App registered successfully'
        });

      case 'register_user':
        const { username, user_id, role } = body;
        
        if (!username) {
          return jsonResponse({ status: 'error', message: 'username required' }, 400);
        }

        const finalUserId = user_id || 'usr_' + generateRandomKey(16);
        
        const existingUser = await DB.prepare('SELECT 1 FROM users WHERE user_id = ?').bind(finalUserId).first();
        if (existingUser) {
          return jsonResponse({ status: 'error', message: 'User ID already exists' }, 400);
        }

        const user_key = 'uk_' + generateRandomKey(32);
        
        // Создаем пользователя
        await DB.prepare(
          'INSERT INTO users (user_id, user_key, username, created_at) VALUES (?, ?, ?, datetime("now"))'
        ).bind(finalUserId, user_key, username).run();

        // Устанавливаем роль если указана
        if (role && ['admin', 'user', 'readonly'].includes(role)) {
          await DB.prepare(
            'INSERT INTO user_roles (user_id, role, created_at) VALUES (?, ?, datetime("now"))'
          ).bind(finalUserId, role).run();
        }

        return jsonResponse({ 
          status: 'ok', 
          user_id: finalUserId,
          user_key,
          role: role || 'user',
          message: 'User registered successfully'
        });

      case 'update_role':
        const { user_id: userIdRole, role: newRole } = body;
        
        if (!userIdRole || !newRole) {
          return jsonResponse({ status: 'error', message: 'user_id and role required' }, 400);
        }

        if (!['admin', 'user', 'readonly'].includes(newRole)) {
          return jsonResponse({ status: 'error', message: 'Invalid role. Use: admin, user, readonly' }, 400);
        }

        // Проверяем существование пользователя
        const userExists = await DB.prepare('SELECT 1 FROM users WHERE user_id = ?').bind(userIdRole).first();
        if (!userExists) {
          return jsonResponse({ status: 'error', message: 'User not found' }, 404);
        }

        // Обновляем или создаем роль
        const existingRole = await DB.prepare('SELECT 1 FROM user_roles WHERE user_id = ?').bind(userIdRole).first();
        
        if (existingRole) {
          await DB.prepare('UPDATE user_roles SET role = ? WHERE user_id = ?').bind(newRole, userIdRole).run();
        } else {
          await DB.prepare('INSERT INTO user_roles (user_id, role, created_at) VALUES (?, ?, datetime("now"))').bind(userIdRole, newRole).run();
        }

        return jsonResponse({ status: 'ok', message: 'Role updated', role: newRole });

      case 'set_table_permission':
        const { user_id: userIdPerm, table_name, permission_type } = body;
        
        if (!userIdPerm || !table_name || !permission_type) {
          return jsonResponse({ status: 'error', message: 'user_id, table_name, and permission_type required' }, 400);
        }

        // Удаляем старое разрешение если есть
        await DB.prepare('DELETE FROM table_permissions WHERE user_id = ? AND table_name = ?').bind(userIdPerm, table_name).run();

        // Добавляем новое
        await DB.prepare(
          'INSERT INTO table_permissions (user_id, table_name, permission_type, created_at) VALUES (?, ?, ?, datetime("now"))'
        ).bind(userIdPerm, table_name, permission_type).run();

        return jsonResponse({ status: 'ok', message: 'Permission set' });

      case 'regenerate_app_key':
        const { app_id: appIdRegen } = body;
        
        if (!appIdRegen) {
          return jsonResponse({ status: 'error', message: 'app_id required' }, 400);
        }

        const new_app_key = 'tk_' + generateRandomKey(32);
        
        const updateApp = await DB.prepare(
          'UPDATE apps SET app_key = ? WHERE app_id = ?'
        ).bind(new_app_key, appIdRegen).run();

        if (updateApp.meta.changes === 0) {
          return jsonResponse({ status: 'error', message: 'App not found' }, 404);
        }

        return jsonResponse({ status: 'ok', new_key: new_app_key });

      case 'regenerate_user_key':
        const { user_id: userIdRegen } = body;
        
        if (!userIdRegen) {
          return jsonResponse({ status: 'error', message: 'user_id required' }, 400);
        }

        const new_user_key = 'uk_' + generateRandomKey(32);
        
        const updateUser = await DB.prepare(
          'UPDATE users SET user_key = ? WHERE user_id = ?'
        ).bind(new_user_key, userIdRegen).run();

        if (updateUser.meta.changes === 0) {
          return jsonResponse({ status: 'error', message: 'User not found' }, 404);
        }

        return jsonResponse({ status: 'ok', new_key: new_user_key });

      case 'delete_app':
        const { app_id: appIdDelete } = body;
        
        if (!appIdDelete) {
          return jsonResponse({ status: 'error', message: 'app_id required' }, 400);
        }

        await DB.prepare('DELETE FROM user_apps WHERE app_id = ?').bind(appIdDelete).run();
        const deleteApp = await DB.prepare('DELETE FROM apps WHERE app_id = ?').bind(appIdDelete).run();

        if (deleteApp.meta.changes === 0) {
          return jsonResponse({ status: 'error', message: 'App not found' }, 404);
        }

        return jsonResponse({ status: 'ok', message: 'App deleted' });

      case 'delete_user':
        const { user_id: userIdDelete } = body;
        
        if (!userIdDelete) {
          return jsonResponse({ status: 'error', message: 'user_id required' }, 400);
        }

        // Каскадное удаление сработает автоматически
        await DB.prepare('DELETE FROM user_apps WHERE user_id = ?').bind(userIdDelete).run();
        await DB.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(userIdDelete).run();
        await DB.prepare('DELETE FROM table_permissions WHERE user_id = ?').bind(userIdDelete).run();
        const deleteUser = await DB.prepare('DELETE FROM users WHERE user_id = ?').bind(userIdDelete).run();

        if (deleteUser.meta.changes === 0) {
          return jsonResponse({ status: 'error', message: 'User not found' }, 404);
        }

        return jsonResponse({ status: 'ok', message: 'User deleted' });

      case 'grant_access':
        const { user_id: userIdGrant, app_id: appIdGrant } = body;
        
        if (!userIdGrant || !appIdGrant) {
          return jsonResponse({ status: 'error', message: 'user_id and app_id required' }, 400);
        }

        const checkUser = await DB.prepare('SELECT 1 FROM users WHERE user_id = ?').bind(userIdGrant).first();
        const checkApp = await DB.prepare('SELECT 1 FROM apps WHERE app_id = ?').bind(appIdGrant).first();
        
        if (!checkUser || !checkApp) {
          return jsonResponse({ status: 'error', message: 'User or App not found' }, 404);
        }

        const existing = await DB.prepare(
          'SELECT 1 FROM user_apps WHERE user_id = ? AND app_id = ?'
        ).bind(userIdGrant, appIdGrant).first();

        if (existing) {
          return jsonResponse({ status: 'ok', message: 'Access already granted' });
        }

        await DB.prepare(
          'INSERT INTO user_apps (user_id, app_id) VALUES (?, ?)'
        ).bind(userIdGrant, appIdGrant).run();

        return jsonResponse({ status: 'ok', message: 'Access granted' });

      case 'revoke_access':
        const { user_id: userIdRevoke, app_id: appIdRevoke } = body;
        
        if (!userIdRevoke || !appIdRevoke) {
          return jsonResponse({ status: 'error', message: 'user_id and app_id required' }, 400);
        }

        const revokeResult = await DB.prepare(
          'DELETE FROM user_apps WHERE user_id = ? AND app_id = ?'
        ).bind(userIdRevoke, appIdRevoke).run();

        if (revokeResult.meta.changes === 0) {
          return jsonResponse({ status: 'error', message: 'Access not found' }, 404);
        }

        return jsonResponse({ status: 'ok', message: 'Access revoked' });

      default:
        return jsonResponse({ 
          status: 'error', 
          message: 'Unknown action',
          available_actions: [
            'verify', 'list_apps', 'list_users', 'list_user_apps',
            'register_app', 'register_user', 'update_role', 'set_table_permission',
            'regenerate_app_key', 'regenerate_user_key',
            'delete_app', 'delete_user',
            'grant_access', 'revoke_access'
          ]
        }, 400);
    }

  } catch (err) {
    return jsonResponse({ 
      status: 'error', 
      message: err.message 
    }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

function generateRandomKey(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}