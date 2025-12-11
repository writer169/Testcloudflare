
import React from 'react';
import { Smartphone, Key, Github, Globe, Info, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#05070a] text-slate-300 p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Globe className="text-orange-500" size={24} />
            </div>
            Cloudflare + MongoDB Deploy
          </h1>
          <p className="text-slate-500 text-sm">
            Залейте этот код на GitHub, и Cloudflare автоматически создаст API эндпоинт.
          </p>
        </header>

        <div className="grid gap-6">
          {/* Step 1: Deployment */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Github size={16} className="text-white" /> 1. Деплой
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 size={16} className="text-green-500" />
                <span>Создайте репозиторий и загрузите эти файлы</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 size={16} className="text-green-500" />
                <span>Подключите его к <b>Cloudflare Pages</b></span>
              </div>
              <p className="text-xs text-slate-500 pl-7">
                API эндпоинт автоматически появится по пути <code className="text-orange-400">/api/test</code> благодаря файлу в папке <code>functions/</code>.
              </p>
            </div>
          </section>

          {/* Step 2: Env Vars */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Key size={16} className="text-blue-400" /> 2. Переменные (Settings → Functions)
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {['MONGODB_API_URL', 'MONGODB_API_KEY', 'MONGODB_DATA_SOURCE', 'MONGODB_DATABASE', 'MONGODB_COLLECTION'].map(v => (
                <div key={v} className="bg-black/40 p-2 px-3 rounded border border-slate-800/50 font-mono text-[11px] text-yellow-500">
                  {v}
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg flex gap-3">
              <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 italic">
                Важно: Добавляйте переменные именно в раздел <b>Functions</b>, а не в Pages Variables. После добавления нужно сделать "Retry deployment".
              </p>
            </div>
          </section>

          {/* Step 3: Tasker */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Smartphone size={16} className="text-purple-400" /> 3. Настройка Tasker
            </h2>
            <div className="bg-black/60 p-4 rounded-xl border border-slate-800 font-mono">
              <div className="text-[10px] text-slate-500 mb-1">METHOD</div>
              <div className="text-sm text-white mb-3">GET</div>
              <div className="text-[10px] text-slate-500 mb-1">URL</div>
              <div className="text-sm text-blue-400 break-all">
                https://your-app.pages.dev/api/test
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default App;
