// public/admin.js

// ВАЖНО: Все импорты React/ReactDOM/хуков/Lucide-react удалены.

// Получаем хуки из глобального объекта React
const { useState, useEffect } = React; 

// Плацхолдеры для иконок Lucide-react (замените на настоящие иконки, если решите использовать сборщик)
const Plus = ({ size = 18, className = '' }) => <span style={{fontSize: size}} className={`align-middle ${className}`}>+</span>;
const Key = ({ size = 18, className = '' }) => <span style={{fontSize: size/1.5}} className={`align-middle ${className}`}>🔑</span>;
const Trash2 = ({ size = 18, className = '' }) => <span style={{fontSize: size/1.5}} className={`align-middle ${className}`}>🗑️</span>;
const RefreshCw = ({ size = 18, className = '' }) => <span style={{fontSize: size/1.5}} className={`align-middle ${className}`}>🔄</span>;
const Eye = ({ size = 18, className = '' }) => <span style={{fontSize: size/1.5}} className={`align-middle ${className}`}>👁️</span>;
const EyeOff = ({ size = 18, className = '' }) => <span style={{fontSize: size/1.5}} className={`align-middle ${className}`}>🚫</span>;
const Users = ({ size = 18, className = '' }) => <span style={{fontSize: size/1.5}} className={`align-middle ${className}`}>🧑‍💻</span>;
const Package = ({ size = 18, className = '' }) => <span style={{fontSize: size/1.5}} className={`align-middle ${className}`}>📦</span>;
const Shield = ({ size = 18, className = '' }) => <span style={{fontSize: size/1.5}} className={`align-middle ${className}`}>🛡️</span>;
const CheckCircle = ({ size = 18, className = '' }) => <span style={{fontSize: size/1.5}} className={`align-middle ${className}`}>✅</span>;
const XCircle = ({ size = 18, className = '' }) => <span style={{fontSize: size/1.5}} className={`align-middle ${className}`}>❌</span>;
const Copy = ({ size = 18, className = '' }) => <span style={{fontSize: size/1.5}} className={`align-middle ${className}`}>📋</span>;
const Check = ({ size = 18, className = '' }) => <span style={{fontSize: size/1.5}} className={`align-middle ${className}`}>✔️</span>;
const Award = ({ size = 18, className = '' }) => <span style={{fontSize: size/1.5}} className={`align-middle ${className}`}>🏅</span>;


const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [masterKey, setMasterKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://testcloudflare-t45.pages.dev');
  
  const [apps, setApps] = useState([]);
  const [users, setUsers] = useState([]);
  const [userApps, setUserApps] = useState([]);
  
  const [activeTab, setActiveTab] = useState('apps');
  const [showKeys, setShowKeys] = useState({});
  const [copiedKey, setCopiedKey] = useState('');
  
  const [newApp, setNewApp] = useState({ app_id: '', app_name: '' });
  const [newUser, setNewUser] = useState({ username: '', user_id: '', role: 'user' });

  const authenticate = async () => {
    if (!masterKey) {
      alert('Введите мастер-ключ');
      return;
    }
    
    try {
      const response = await fetch(`${baseUrl}/api/admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${masterKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'verify' })
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        loadData();
      } else {
        alert('Неверный мастер-ключ');
      }
    } catch (err) {
      alert('Ошибка подключения');
    }
  };

  const loadData = async () => {
    try {
      const [appsRes, usersRes, userAppsRes] = await Promise.all([
        apiCall('list_apps'),
        apiCall('list_users'),
        apiCall('list_user_apps')
      ]);
      
      if (appsRes?.data) setApps(appsRes.data);
      if (usersRes?.data) setUsers(usersRes.data);
      if (userAppsRes?.data) setUserApps(userAppsRes.data);
    } catch (err) {
      console.error('Load error:', err);
    }
  };

  const apiCall = async (action, data = {}) => {
    const response = await fetch(`${baseUrl}/api/admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${masterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, ...data })
    });
    
    return response.json();
  };

  const registerApp = async () => {
    if (!newApp.app_id || !newApp.app_name) {
      alert('Заполните все поля');
      return;
    }
    
    const result = await apiCall('register_app', newApp);
    if (result.status === 'ok') {
      setNewApp({ app_id: '', app_name: '' });
      loadData();
      alert(`Приложение создано!\n\nКлюч:\n${result.app_key}\n\nСохраните его!`);
    } else {
      alert('Ошибка: ' + result.message);
    }
  };

  const registerUser = async () => {
    if (!newUser.username) {
      alert('Введите имя пользователя');
      return;
    }
    
    const result = await apiCall('register_user', newUser);
    if (result.status === 'ok') {
      setNewUser({ username: '', user_id: '', role: 'user' });
      loadData();
      alert(`Пользователь создан!\n\nID: ${result.user_id}\nКлюч: ${result.user_key}\nРоль: ${result.role}\n\nСохраните ключ!`);
    } else {
      alert('Ошибка: ' + result.message);
    }
  };

  const updateRole = async (userId, newRole) => {
    const result = await apiCall('update_role', { user_id: userId, role: newRole });
    if (result.status === 'ok') {
      loadData();
      alert(`Роль обновлена на: ${newRole}`);
    }
  };

  const regenerateKey = async (type, id) => {
    if (!confirm('Старый ключ перестанет работать. Продолжить?')) return;
    
    const action = type === 'app' ? 'regenerate_app_key' : 'regenerate_user_key';
    const field = type === 'app' ? 'app_id' : 'user_id';
    
    const result = await apiCall(action, { [field]: id });
    if (result.status === 'ok') {
      loadData();
      alert(`Новый ключ:\n${result.new_key}\n\nСохраните его!`);
    }
  };

  const deleteItem = async (type, id) => {
    if (!confirm('Удалить безвозвратно?')) return;
    
    const action = type === 'app' ? 'delete_app' : 'delete_user';
    const field = type === 'app' ? 'app_id' : 'user_id';
    
    const result = await apiCall(action, { [field]: id });
    if (result.status === 'ok') {
      loadData();
    }
  };

  const toggleAccess = async (userId, appId, hasAccess) => {
    const action = hasAccess ? 'revoke_access' : 'grant_access';
    const result = await apiCall(action, { user_id: userId, app_id: appId });
    if (result.status === 'ok') {
      loadData();
    }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const hasAccess = (userId, appId) => {
    return userApps.some(ua => ua.user_id === userId && ua.app_id === appId);
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-red-500/20 text-red-400 border-red-500/30',
      user: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      readonly: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[role] || colors.user;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-purple-400" size={32} />
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
                placeholder="https://your-app.pages.dev"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">Master Key</label>
              <input
                type="password"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && authenticate()}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
                placeholder="Введите мастер-ключ"
              />
            </div>
            
            <button
              onClick={authenticate}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-3 font-semibold transition"
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="text-purple-400" size={32} />
              <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-slate-400 hover:text-white transition text-sm"
            >
              Выйти
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('apps')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                activeTab === 'apps'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              <Package size={18} />
              Приложения
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              <Users size={18} />
              Пользователи
            </button>
            <button
              onClick={() => setActiveTab('access')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                activeTab === 'access'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              <Key size={18} />
              Доступы
            </button>
          </div>
        </header>

        {activeTab === 'apps' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Добавить приложение</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="App ID (например: tasker)"
                  value={newApp.app_id}
                  onChange={(e) => setNewApp({ ...newApp, app_id: e.target.value })}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
                />
                <input
                  type="text"
                  placeholder="Название (например: Tasker)"
                  value={newApp.app_name}
                  onChange={(e) => setNewApp({ ...newApp, app_name: e.target.value })}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <button
                onClick={registerApp}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-2 flex items-center gap-2 transition"
              >
                <Plus size={18} />
                Создать приложение
              </button>
            </div>

            <div className="grid gap-4">
              {apps.map((app) => (
                <div key={app.app_id} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{app.app_name}</h3>
                      <p className="text-sm text-slate-400">ID: {app.app_id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => regenerateKey('app', app.app_id)}
                        className="p-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg transition"
                        title="Перегенерировать ключ"
                      >
                        <RefreshCw size={18} />
                      </button>
                      <button
                        onClick={() => deleteItem('app', app.app_id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
                        title="Удалить"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-green-400 font-mono break-all">
                        {showKeys[app.app_id] ? app.app_key : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setShowKeys({ ...showKeys, [app.app_id]: !showKeys[app.app_id] })}
                          className="p-1 hover:bg-slate-800 rounded transition"
                        >
                          {showKeys[app.app_id] ? <EyeOff size={16} className="text-slate-400" /> : <Eye size={16} className="text-slate-400" />}
                        </button>
                        <button
                          onClick={() => copyKey(app.app_key)}
                          className="p-1 hover:bg-slate-800 rounded transition"
                        >
                          {copiedKey === app.app_key ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-slate-400" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 mt-2">
                    Создано: {new Date(app.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Добавить пользователя</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Username (john)"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
                />
                <input
                  type="text"
                  placeholder="User ID (опционально)"
                  value={newUser.user_id}
                  onChange={(e) => setNewUser({ ...newUser, user_id: e.target.value })}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="readonly">Readonly</option>
                </select>
              </div>
              <button
                onClick={registerUser}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 flex items-center gap-2 transition"
              >
                <Plus size={18} />
                Создать пользователя
              </button>
            </div>

            <div className="grid gap-4">
              {users.map((user) => (
                <div key={user.user_id} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-white">{user.username}</h3>
                        <span className={`px-2 py-1 rounded text-xs border ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">ID: {user.user_id}</p>
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user.user_id, e.target.value)}
                        className="mt-2 bg-slate-900/50 border border-slate-700 rounded px-3 py-1 text-sm text-white"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="readonly">Readonly</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => regenerateKey('user', user.user_id)}
                        className="p-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg transition"
                        title="Перегенерировать ключ"
                      >
                        <RefreshCw size={18} />
                      </button>
                      <button
                        onClick={() => deleteItem('user', user.user_id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
                        title="Удалить"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-blue-400 font-mono break-all">
                        {showKeys[user.user_id] ? user.user_key : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setShowKeys({ ...showKeys, [user.user_id]: !showKeys[user.user_id] })}
                          className="p-1 hover:bg-slate-800 rounded transition"
                        >
                          {showKeys[user.user_id] ? <EyeOff size={16} className="text-slate-400" /> : <Eye size={16} className="text-slate-400" />}
                        </button>
                        <button
                          onClick={() => copyKey(user.user_key)}
                          className="p-1 hover:bg-slate-800 rounded transition"
                        >
                          {copiedKey === user.user_key ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-slate-400" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 mt-2">
                    Создано: {new Date(user.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Управление доступами</h2>
              <p className="text-slate-400 text-sm">
                Нажмите на иконку, чтобы выдать или отозвать доступ пользователя к приложению
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-slate-400 font-semibold">Пользователь</th>
                    {apps.map(app => (
                      <th key={app.app_id} className="text-center p-4 text-slate-400 font-semibold">
                        {app.app_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.user_id} className="border-b border-slate-800">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-white font-semibold">{user.username}</div>
                            <div className="text-xs text-slate-500">{user.user_id}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs border ${getRoleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                      </td>
                      {apps.map(app => {
                        const access = hasAccess(user.user_id, app.app_id);
                        return (
                          <td key={app.app_id} className="p-4 text-center">
                            <button
                              onClick={() => toggleAccess(user.user_id, app.app_id, access)}
                              className={`p-2 rounded-lg transition ${
                                access
                                  ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                                  : 'bg-red-600/20 hover:bg-red-600/30 text-red-400'
                              }`}
                            >
                              {access ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
      
// Финальный рендеринг с использованием глобального ReactDOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(AdminPanel));