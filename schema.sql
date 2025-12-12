-- Cloudflare D1 Complete Schema
-- Система с ролями и детальным контролем доступа

-- ============================================
-- ТАБЛИЦЫ АВТОРИЗАЦИИ
-- ============================================

-- Приложения
CREATE TABLE IF NOT EXISTS apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id TEXT UNIQUE NOT NULL,
  app_key TEXT UNIQUE NOT NULL,
  app_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Пользователи
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE NOT NULL,
  user_key TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Связи пользователь-приложение
CREATE TABLE IF NOT EXISTS user_apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, app_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (app_id) REFERENCES apps(app_id) ON DELETE CASCADE
);

-- ============================================
-- ТАБЛИЦЫ РОЛЕЙ И ПРАВ
-- ============================================

-- Роли пользователей
-- Роль определяет базовые права доступа
CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user', 'readonly'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Детальные права на таблицы
-- Позволяет гибко управлять доступом к конкретным таблицам
CREATE TABLE IF NOT EXISTS table_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  permission_type TEXT NOT NULL, -- 'select', 'insert', 'update', 'delete', '*' (все)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, table_name),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ============================================

CREATE INDEX IF NOT EXISTS idx_apps_key ON apps(app_key);
CREATE INDEX IF NOT EXISTS idx_users_key ON users(user_key);
CREATE INDEX IF NOT EXISTS idx_user_apps_user ON user_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_apps_app ON user_apps(app_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_table_permissions_user ON table_permissions(user_id);

-- ============================================
-- ПРИМЕРЫ ТАБЛИЦ ПРИЛОЖЕНИЙ
-- ============================================

-- Пример 1: Приватная таблица с user_id (Tasker логи)
CREATE TABLE IF NOT EXISTS tasker_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  task_name TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tasker_logs_user ON tasker_logs(user_id);

-- Пример 2: Приватная таблица (Fitness тренировки)
CREATE TABLE IF NOT EXISTS fitness_workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  exercise TEXT NOT NULL,
  reps INTEGER,
  weight REAL,
  duration_minutes INTEGER,
  notes TEXT,
  workout_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fitness_workouts_user ON fitness_workouts(user_id);

-- Пример 3: Публичная таблица (настройки приложения)
-- Не содержит user_id - доступна всем
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Пример 4: Универсальное key-value хранилище
CREATE TABLE IF NOT EXISTS app_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(app_id, user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_app_data_lookup ON app_data(app_id, user_id, key);

-- Пример 5: Shared таблица с флагом публичности
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_public INTEGER DEFAULT 0, -- 0 = приватная, 1 = публичная
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_public ON notes(is_public);

-- ============================================
-- СПРАВОЧНАЯ ИНФОРМАЦИЯ
-- ============================================

-- Описание ролей
-- 'admin' - полный доступ ко всем таблицам и данным всех пользователей
-- 'user' - доступ только к своим данным (фильтрация по user_id)
-- 'readonly' - только чтение своих данных

-- Публичные таблицы (константа в коде):
-- ['app_settings', 'reference_data']

-- Системные таблицы (запрещены через API):
-- ['apps', 'users', 'user_apps', 'user_roles', 'table_permissions']