import React from 'react';
import { Smartphone, Key, Github, Globe, Info, CheckCircle2, Zap, Database } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#05070a] text-slate-300 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Globe className="text-red-500" size={24} />
            </div>
            Cloudflare + Redis Cloud API
          </h1>
          <p className="text-slate-500 text-sm">
            Два эндпоинта: быстрый ping и тест Redis Cloud (redis.io)
          </p>
        </header>

        <div className="grid gap-6">
          {/* Step 0: Redis Cloud Setup */}
          <section className="bg-gradient-to-br from-red-500/5 to-orange-500/5 border border-red-500/20 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database size={16} /> 0. Настройка Redis Cloud
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 size={16} className="text-green-500" />
                <span>Зарегистрируйтесь на <b className="text-white">redis.io</b> или <b className="text-white">app.redislabs.com</b></span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 size={16} className="text-green-500" />
                <span>Создайте Free database (30MB бесплатно)</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 size={16} className="text-green-500" />
                <span>В настройках базы включите <b className="text-white">REST API</b></span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 size={16} className="text-green-500" />
                <span>Скопируйте <b className="text-white">Public endpoint</b>, <b className="text-white">Port</b> и <b className="text-white">Default user password</b></span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
              <p className="text-xs text-slate-400">
                ℹ️ Redis Cloud предоставляет 30MB бесплатно. Не забудьте включить REST API в настройках базы!
              </p>
            </div>
          </section>

          {/* Step 1: Deployment */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Github size={16} className="text-white" /> 1. Деплой
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 size={16} className="text-green-500" />
                <span>Создайте репозиторий и загрузите файлы</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 size={16} className="text-green-500" />
                <span>Подключите к <b>Cloudflare Pages</b></span>
              </div>
            </div>
          </section>

          {/* Step 2: Env Vars */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Key size={16} className="text-blue-400" /> 2. Переменные (Settings → Functions)
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {[
                { name: 'REDIS_HOST', example: 'redis-12345.c123.us-east-1-3.ec2.cloud.redislabs.com' },
                { name: 'REDIS_PORT', example: '12345 (опционально, по умолчанию 6379)' },
                { name: 'REDIS_PASSWORD', example: 'your-password-here' }
              ].map(v => (
                <div key={v.name} className="bg-black/40 p-3 rounded border border-slate-800/50">
                  <div className="font-mono text-[11px] text-yellow-500 mb-1">{v.name}</div>
                  <div className="text-[10px] text-slate-500">{v.example}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg flex gap-3">
              <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-400">
                <p className="mb-2"><b>REDIS_HOST</b> - Public endpoint из Redis Cloud (без redis:// и порта)</p>
                <p className="mb-2"><b>REDIS_PASSWORD</b> - Default user password из Redis Cloud</p>
                <p>Добавляйте в раздел <b>Functions</b>, после - "Retry deployment"</p>
              </div>
            </div>
          </section>

          {/* API Endpoints */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" /> 3. API Эндпоинты
            </h2>
            
            {/* Ping endpoint */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-green-400" />
                <h3 className="text-sm font-semibold text-white">Ping (без Redis)</h3>
              </div>
              <div className="bg-black/60 p-4 rounded-xl border border-slate-800 font-mono">
                <div className="text-[10px] text-slate-500 mb-1">METHOD</div>
                <div className="text-sm text-white mb-3">GET</div>
                <div className="text-[10px] text-slate-500 mb-1">URL</div>
                <div className="text-sm text-blue-400 break-all">
                  https://your-app.pages.dev/api/ping
                </div>
              </div>
            </div>

            {/* Test endpoint */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database size={14} className="text-red-400" />
                <h3 className="text-sm font-semibold text-white">Test (с Redis Cloud)</h3>
              </div>
              <div className="bg-black/60 p-4 rounded-xl border border-slate-800 font-mono">
                <div className="text-[10px] text-slate-500 mb-1">METHOD</div>
                <div className="text-sm text-white mb-3">GET</div>
                <div className="text-[10px] text-slate-500 mb-1">ПРИМЕРЫ</div>
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-blue-400 break-all">
                    https://your-app.pages.dev/api/test?cmd=ping
                  </div>
                  <div className="text-xs text-purple-400 break-all">
                    https://your-app.pages.dev/api/test?cmd=get&key=mykey
                  </div>
                  <div className="text-xs text-orange-400 break-all">
                    https://your-app.pages.dev/api/test?cmd=set&key=mykey&value=hello
                  </div>
                  <div className="text-xs text-green-400 break-all">
                    https://your-app.pages.dev/api/test?cmd=keys&pattern=user:*
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mb-2">ПАРАМЕТРЫ</div>
                <div className="space-y-2 text-xs">
                  <div className="flex gap-2">
                    <code className="text-orange-400">cmd</code>
                    <span className="text-slate-400">- команда: ping, get, set, del, exists, ttl, keys, info</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="text-orange-400">key</code>
                    <span className="text-slate-400">- ключ для get/set/del/exists/ttl</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="text-orange-400">value</code>
                    <span className="text-slate-400">- значение для set</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="text-orange-400">pattern</code>
                    <span className="text-slate-400">- паттерн для keys (по умолчанию *)</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Step 4: Tasker */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Smartphone size={16} className="text-purple-400" /> 4. Примеры для Tasker
            </h2>
            <div className="space-y-3">
              <div className="bg-black/40 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 mb-1">Быстрый тест</div>
                <code className="text-xs text-green-400">GET https://your-app.pages.dev/api/ping</code>
              </div>
              <div className="bg-black/40 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 mb-1">Проверка Redis</div>
                <code className="text-xs text-blue-400">GET https://your-app.pages.dev/api/test?cmd=ping</code>
              </div>
              <div className="bg-black/40 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 mb-1">Записать значение</div>
                <code className="text-xs text-orange-400">GET https://your-app.pages.dev/api/test?cmd=set&key=test&value=123</code>
              </div>
              <div className="bg-black/40 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 mb-1">Получить значение</div>
                <code className="text-xs text-purple-400">GET https://your-app.pages.dev/api/test?cmd=get&key=test</code>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-8 text-center text-xs text-slate-600">
          <p>Redis Cloud + REST API = надёжное решение для Cloudflare Workers 🚀</p>
        </footer>
      </div>
    </div>
  );
};

export default App;