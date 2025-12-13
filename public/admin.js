import { useState, useEffect } from 'react';

// Icon components using emoji
const Plus = ({ size = 18 }) => <span style={{fontSize: size}}>+</span>;
const Key = ({ size = 18 }) => <span style={{fontSize: size/1.5}}>🔑</span>;
const Trash2 = ({ size = 18 }) => <span style={{fontSize: size/1.5}}>🗑️</span>;
const RefreshCw = ({ size = 18 }) => <span style={{fontSize: size/1.5}}>🔄</span>;
const Eye = ({ size = 18 }) => <span style={{fontSize: size/1.5}}>👁️</span>;
const EyeOff = ({ size = 18 }) => <span style={{fontSize: size/1.5}}>🚫</span>;
const Users = ({ size = 18 }) => <span style={{fontSize: size/1.5}}>🧑‍💻</span>;
const Package = ({ size = 18 }) => <span style={{fontSize: size/1.5}}>📦</span>;
const Shield = ({ size = 32 }) => <span style={{fontSize: size/1.5}}>🛡️</span>;
const CheckCircle = ({ size = 20 }) => <span style={{fontSize: size/1.5}}>✅</span>;
const XCircle = ({ size = 20 }) => <span style={{fontSize: size/1.5}}>❌</span>;
const Copy = ({ size = 18 }) => <span style={{fontSize: size/1.5}}>📋</span>;
const Check = ({ size = 18 }) => <span style={{fontSize: size/1.5}}>✔️</span>;
const ChevronDown = ({ size = 18 }) => <span style={{fontSize: size/1.5}}>▼</span>;
const ChevronUp = ({ size = 18 }) => <span style={{fontSize: size/1.5}}>▲</span>;

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [masterKey, setMasterKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://testcloudflare-t45.pages.dev');
  
  const [apps, setApps] = useState([]);
  const [users, setUsers] = useState([]);
  const [userApps, setUserApps] = useState([]);
  
  const [activeTab, setActiveTab] = useState('apps');
  const [showKeys, setShowKeys] = useState({});
  const [copiedKey, setCopiedKey] = useState('');
  const [expandedCards, setExpandedCards] = useState({});
  
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

  const toggleCard = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <Shield size={32} />
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm"
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
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield size={24} />
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-slate-400 hover:text-white transition text-sm px-3 py-1 bg-slate-800/50 rounded-lg"
            >
              Выйти
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('apps')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
                activeTab === 'apps'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/50 text-slate-400'
              }`}
            >
              <Package size={16} />
              <span>Приложения</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/50 text-slate-400'
              }`}
            >
              <Users size={16} />
              <span>Пользователи</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'apps' && (
          <>
            {/* Add App Form */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-4">
              <h2 className="text-lg font-bold text-white mb-3">Добавить приложение</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="App ID (например: tasker)"
                  value={newApp.app_id}
                  onChange={(e) => setNewApp({ ...newApp, app_id: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm"
                />
                <input
                  type="text"
                  placeholder="Название (например: Tasker)"
                  value={newApp.app_name}
                  onChange={(e) => setNewApp({ ...newApp, app_name: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm"
                />
                <button
                  onClick={registerApp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 transition text-sm font-semibold"
                >
                  <Plus size={16} />
                  Создать приложение
                </button>
              </div>
            </div>

            {/* Apps List */}
            {apps.map((app) => (
              <div key={app.app_id} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl overflow-hidden">
                {/* Card Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{app.app_name}</h3>
                      <p className="text-xs text-slate-400">ID: {app.app_id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => regenerateKey('app', app.app_id)}
                        className="p-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg transition"
                        title="Перегенерировать ключ"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button
                        onClick={() => deleteItem('app', app.app_id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* API Key */}
                  <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-green-400 font-mono break-all flex-1">
                        {showKeys[app.app_id] ? app.app_key : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setShowKeys({ ...showKeys, [app.app_id]: !showKeys[app.app_id] })}
                          className="p-1 hover:bg-slate-800 rounded transition"
                        >
                          {showKeys[app.app_id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => copyKey(app.app_key)}
                          className="p-1 hover:bg-slate-800 rounded transition"
                        >
                          {copiedKey === app.app_key ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() => toggleCard(`app_${app.app_id}`)}
                    className="w-full flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300 transition text-sm py-2"
                  >
                    <span>Доступы пользователей</span>
                    {expandedCards[`app_${app.app_id}`] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Expanded Content - User Access */}
                {expandedCards[`app_${app.app_id}`] && (
                  <div className="border-t border-slate-700 bg-slate-900/30 p-4">
                    <div className="space-y-2">
                      {users.map(user => {
                        const access = hasAccess(user.user_id, app.app_id);
                        return (
                          <div key={user.user_id} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex-1">
                                <div className="text-white text-sm font-medium">{user.username}</div>
                                <div className="text-xs text-slate-500">{user.user_id}</div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-xs border ${getRoleBadge(user.role)}`}>
                                {user.role}
                              </span>
                            </div>
                            <button
                              onClick={() => toggleAccess(user.user_id, app.app_id, access)}
                              className={`ml-2 p-2 rounded-lg transition ${
                                access
                                  ? 'bg-green-600/20 text-green-400'
                                  : 'bg-red-600/20 text-red-400'
                              }`}
                            >
                              {access ? <CheckCircle size={18} /> : <XCircle size={18} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="px-4 pb-3">
                  <p className="text-xs text-slate-500">
                    Создано: {new Date(app.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'users' && (
          <>
            {/* Add User Form */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-4">
              <h2 className="text-lg font-bold text-white mb-3">Добавить пользователя</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Username (john)"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm"
                />
                <input
                  type="text"
                  placeholder="User ID (опционально)"
                  value={newUser.user_id}
                  onChange={(e) => setNewUser({ ...newUser, user_id: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm"
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="readonly">Readonly</option>
                </select>
                <button
                  onClick={registerUser}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 transition text-sm font-semibold"
                >
                  <Plus size={16} />
                  Создать пользователя
                </button>
              </div>
            </div>

            {/* Users List */}
            {users.map((user) => (
              <div key={user.user_id} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl overflow-hidden">
                {/* Card Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-lg font-bold text-white">{user.username}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs border ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">ID: {user.user_id}</p>
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user.user_id, e.target.value)}
                        className="bg-slate-900/50 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
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
                        <RefreshCw size={16} />
                      </button>
                      <button
                        onClick={() => deleteItem('user', user.user_id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* User Key */}
                  <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-blue-400 font-mono break-all flex-1">
                        {showKeys[user.user_id] ? user.user_key : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setShowKeys({ ...showKeys, [user.user_id]: !showKeys[user.user_id] })}
                          className="p-1 hover:bg-slate-800 rounded transition"
                        >
                          {showKeys[user.user_id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => copyKey(user.user_key)}
                          className="p-1 hover:bg-slate-800 rounded transition"
                        >
                          {copiedKey === user.user_key ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() => toggleCard(`user_${user.user_id}`)}
                    className="w-full flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300 transition text-sm py-2"
                  >
                    <span>Доступ к приложениям</span>
                    {expandedCards[`user_${user.user_id}`] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Expanded Content - App Access */}
                {expandedCards[`user_${user.user_id}`] && (
                  <div className="border-t border-slate-700 bg-slate-900/30 p-4">
                    <div className="space-y-2">
                      {apps.map(app => {
                        const access = hasAccess(user.user_id, app.app_id);
                        return (
                          <div key={app.app_id} className="flex items-center justify-between py-2">
                            <div className="flex-1">
                              <div className="text-white text-sm font-medium">{app.app_name}</div>
                              <div className="text-xs text-slate-500">{app.app_id}</div>
                            </div>
                            <button
                              onClick={() => toggleAccess(user.user_id, app.app_id, access)}
                              className={`ml-2 p-2 rounded-lg transition ${
                                access
                                  ? 'bg-green-600/20 text-green-400'
                                  : 'bg-red-600/20 text-red-400'
                              }`}
                            >
                              {access ? <CheckCircle size={18} /> : <XCircle size={18} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="px-4 pb-3">
                  <p className="text-xs text-slate-500">
                    Создано: {new Date(user.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}