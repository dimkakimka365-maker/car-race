import React, { useState } from 'react';
import { Play, Trophy, HelpCircle, Gamepad2, Info, ChevronRight, Zap } from 'lucide-react';
import { CarConfig, TrackConfig, LeaderboardEntry } from '../types';

interface MenuProps {
  cars: CarConfig[];
  selectedCarId: string;
  setSelectedCarId: (id: string) => void;
  tracks: TrackConfig[];
  selectedTrackId: string;
  setSelectedTrackId: (id: string) => void;
  leaderboard: LeaderboardEntry[];
  driverName: string;
  setDriverName: (name: string) => void;
  onStartGame: () => void;
  bestScore: number;
}

export const Menu: React.FC<MenuProps> = ({
  cars,
  selectedCarId,
  setSelectedCarId,
  tracks,
  selectedTrackId,
  setSelectedTrackId,
  leaderboard,
  driverName,
  setDriverName,
  onStartGame,
  bestScore
}) => {
  const [activeTab, setActiveTab] = useState<'play' | 'leaderboard' | 'help'>('play');
  const selectedCar = cars.find(c => c.id === selectedCarId) || cars[0];
  const selectedTrack = tracks.find(r => r.id === selectedTrackId) || tracks[0];

  const handleStart = () => {
    if (!driverName.trim()) {
      setDriverName("Poygachi_" + Math.floor(Math.random() * 1000));
    }
    onStartGame();
  };

  return (
    <div className="absolute inset-0 bg-[#04020a] overflow-y-auto overflow-x-hidden flex flex-col justify-between p-4 sm:p-8 font-sans text-white z-20">
      {/* Intense Neon Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,211,238,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(236,72,153,0.06)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_65%,transparent_100%)] opacity-80" />

      {/* Header Title with extreme modern layout styling */}
      <div className="relative text-center my-6 flex flex-col items-center">
        {/* Glow behind logo */}
        <div className="absolute w-96 h-20 bg-cyan-500/15 blur-3xl rounded-full" />
        <div className="absolute w-96 h-20 bg-pink-500/10 blur-3xl rounded-full translate-y-4" />
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-300 select-none uppercase drop-shadow-[0_5px_15px_rgba(34,211,238,0.55)] font-sans italic">
          3D MOSHINA O'YINI
        </h1>
        <p className="text-xs sm:text-sm font-black tracking-widest text-cyan-400 mt-2.5 uppercase font-mono bg-cyan-950/40 px-3 py-1 border border-cyan-800/30 rounded-md">
          PRO-LEVEL ARCADE HIGH-SPEED EXPERIENCE
        </p>

        {/* Global Best Score Bar */}
        {bestScore > 0 && (
          <div className="mt-4.5 inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/40 rounded-full text-xs text-amber-300 font-bold tracking-wider uppercase animate-pulse">
            <Trophy className="w-4 h-4 text-amber-400 fill-current" />
            Eng Yuqori Natija: <span className="font-mono text-white text-sm pl-1">{bestScore}</span> <span className="pl-0.5">ball</span>
          </div>
        )}
      </div>

      {/* Main Tab Navigation */}
      <div className="relative flex justify-center mb-6 z-10">
        <div className="bg-black/80 border-2 border-[#ec4899]/70 rounded-2xl p-1.5 flex gap-2 w-full max-w-md shadow-[0_0_15px_rgba(236,72,153,0.3)]">
          <button
            onClick={() => setActiveTab('play')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition duration-300 cursor-pointer ${
              activeTab === 'play'
                ? 'bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white shadow-[0_0_10px_rgba(6,182,212,0.5)] border border-white/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-cyan-400" />
            Poyga
          </button>
          
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition duration-300 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-[#ec4899] to-[#a855f7] text-white shadow-[0_0_10px_rgba(236,72,153,0.5)] border border-white/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Trophy className="w-4 h-4 text-pink-400" />
            Peshqadamlar
          </button>
          
          <button
            onClick={() => setActiveTab('help')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition duration-300 cursor-pointer ${
              activeTab === 'help'
                ? 'bg-gradient-to-r from-[#f97316] to-[#eab308] text-white shadow-[0_0_10px_rgba(249,115,22,0.5)] border border-white/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-orange-400" />
            Boshqaruv
          </button>
        </div>
      </div>

      {/* Dynamic Tab Contents */}
      <div className="relative flex-1 max-w-5xl w-full mx-auto flex items-center justify-center z-10 px-1 mb-8">
        {activeTab === 'play' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
            {/* LEFT AREA: Car Selection Card & Driver Info */}
            <div className="lg:col-span-12 xl:col-span-7 flex flex-col justify-between space-y-4">
              <div className="vibrant-glass rounded-3xl p-6 shadow-2xl flex-1">
                <h2 className="text-xl font-black mb-4 text-[#22d3ee] flex items-center gap-2 tracking-wide uppercase font-sans">
                  <span className="text-2xl animate-pulse">🚗</span> MOSHINANI TANLANG
                </h2>
                
                {/* Car List Selection Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
                  {cars.map((car) => {
                    const isSelected = car.id === selectedCarId;
                    return (
                      <button
                        key={car.id}
                        onClick={() => setSelectedCarId(car.id)}
                        className={`group relative flex flex-col p-3.5 rounded-2xl border text-left transition duration-300 cursor-pointer ${
                          isSelected
                            ? 'bg-[#22d3ee]/10 border-[#22d3ee] shadow-[0_0_15px_rgba(34,211,238,0.4)] scale-102 font-bold'
                            : 'bg-black/50 border-white/5 hover:border-[#ec4899]/50 hover:bg-[#ec4899]/5'
                        }`}
                      >
                        {/* Interactive miniature preview dot */}
                        <div
                          className="w-full h-11 rounded-xl mb-2.5 shadow-inner border border-white/10"
                          style={{
                            backgroundColor: car.color,
                            backgroundImage: `linear-gradient(135deg, ${car.color}, ${car.secondaryColor})`
                          }}
                        />
                        <span className="text-xs font-black truncate tracking-tight uppercase">{car.name}</span>
                        <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{car.description}</span>

                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#ec4899] rounded-full animate-ping" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Car Specs detail bars */}
                <div className="mt-5 p-4.5 bg-black/60 border-2 border-white/5 rounded-2xl shadow-inner">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-black text-[#22d3ee] uppercase tracking-wider">{selectedCar.name} SPETSIFIKATSIYALARI:</span>
                    <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">TUNED ARCADE</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Max Speed */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400 uppercase font-bold tracking-wider">TEZLIK</span>
                        <span className="font-extrabold text-[#22d3ee] font-mono">{selectedCar.speed * 10}0 km/s</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.6)]" style={{ width: `${selectedCar.speed * 30}%` }} />
                      </div>
                    </div>

                    {/* Acceleration */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400 uppercase font-bold tracking-wider">TEZLASHISH</span>
                        <span className="font-extrabold text-[#ec4899] font-mono">X {Math.round(selectedCar.acceleration * 10)}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.6)]" style={{ width: `${selectedCar.acceleration * 60}%` }} />
                      </div>
                    </div>

                    {/* Handling */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400 uppercase font-bold tracking-wider">BOSHQARUVCHANLIK</span>
                        <span className="font-extrabold text-amber-400 font-mono">{Math.round(selectedCar.handling * 100)} / 100</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]" style={{ width: `${selectedCar.handling * 80}%` }} />
                      </div>
                    </div>

                    {/* Nitro Duration */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400 uppercase font-bold tracking-wider">NITRO QUVVATI</span>
                        <span className="font-extrabold text-purple-400 font-mono">{selectedCar.nitro > 1.2 ? 'SUPERCHARGE' : 'STABIL'}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.6)]" style={{ width: `${(selectedCar.nitro) * 60}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver name input input card */}
              <div className="bg-black/80 border-2 border-[#22d3ee]/40 rounded-3xl p-4.5 flex flex-col md:flex-row items-center gap-4 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                <div className="flex-1 w-full relative">
                  <label className="block text-[10px] font-black uppercase text-[#22d3ee] tracking-widest mb-1.5 pl-1.5">
                    HAYDOVCHI REKORD ISMINGIZ
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Ismingizni kiriting..."
                    className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl focus:border-[#22d3ee] focus:ring-1 focus:ring-[#22d3ee] text-white font-black uppercase outline-none text-sm tracking-wider transition shadow-inner font-mono"
                  />
                  <div className="absolute right-3.5 bottom-3 text-xs opacity-35 font-mono text-cyan-400">⚡</div>
                </div>
              </div>
            </div>

            {/* RIGHT AREA: Track Selection Card & Big CTA */}
            <div className="lg:col-span-12 xl:col-span-5 flex flex-col justify-between space-y-4">
              <div className="secondary-glass rounded-3xl p-6 shadow-2xl flex-1">
                <h2 className="text-xl font-black mb-4 text-[#ec4899] flex items-center gap-2 tracking-wide uppercase font-sans">
                  <span className="text-2xl animate-pulse">🏁</span> TRASSANI TANLANG
                </h2>

                <div className="space-y-3">
                  {tracks.map((track) => {
                    const isSelected = track.id === selectedTrackId;
                    return (
                      <button
                        key={track.id}
                        onClick={() => setSelectedTrackId(track.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition duration-300 cursor-pointer ${
                          isSelected
                            ? 'bg-[#ec4899]/10 border-[#ec4899] shadow-[0_0_12px_rgba(236,72,153,0.35)] scale-102'
                            : 'bg-black/50 border-white/5 hover:bg-[#22d3ee]/5 hover:border-[#22d3ee]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Sky / ground indicator block */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-inner border border-white/10"
                            style={{ backgroundColor: track.color }}
                          >
                            🚀
                          </div>
                          <div>
                            <div className="text-sm font-black uppercase tracking-wide text-white">{track.name}</div>
                            <div className="text-[10px] text-slate-400 mt-1 pl-0.5">{track.description}</div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          <span
                            className={`text-[9px] font-black px-2.5 py-1 rounded-md border tracking-wider ${
                              track.difficulty === 'Oson'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : track.difficulty === 'O\'rtacha'
                                ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {track.difficulty.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400 font-bold">{track.length} m</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Huge Play CTA Button */}
              <button
                onClick={handleStart}
                id="btn-start-poyga"
                className="w-full relative group py-5.5 vibrant-btn-primary rounded-3xl font-black text-xl text-white shadow-2xl flex items-center justify-center gap-3.5 transition-transform hover:scale-[1.02] active:scale-98 cursor-pointer overflow-hidden tracking-wider uppercase italic"
              >
                {/* Gleam gloss animation overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.25)_50%,transparent_75%)] bg-[length:250%_250%] group-hover:animate-shine duration-1000" />
                <Play className="w-6 h-6 fill-current text-white animate-bounce" />
                <span>POYGANI BOSHLASH</span>
                <ChevronRight className="w-5 h-5 text-white animate-pulse" />
              </button>
            </div>
          </div>
        )}

        {/* Tab: Leaderboard displaying nice card grids */}
        {activeTab === 'leaderboard' && (
          <div className="secondary-glass rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-5 text-[#ec4899] flex items-center gap-2.5 justify-center tracking-wider italic uppercase">
              <Trophy className="w-6 h-6 animate-bounce text-[#ec4899]" />
              ENG YUQORI NATIJALAR JADVALI
            </h2>

            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-3 bg-black/60 rounded-2xl border border-white/5">
                <div className="text-4xl">⏱️</div>
                <div className="text-sm font-black uppercase text-pink-400">Hozircha natijalar mavjud emas.</div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">Siz poygani birinchi bo'lib yakunlab, bu jadvalda rekord o'rnatishingiz mumkin!</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border-2 border-white/5 bg-black/70 shadow-lg">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-black/90 border-b-2 border-[#ec4899] text-pink-400 text-xs font-black uppercase tracking-wider">
                      <th className="px-4 py-3.5 text-center">O'rin</th>
                      <th className="px-4 py-3.5">Poygachi</th>
                      <th className="px-4 py-3.5 text-center">Avto / Trassa</th>
                      <th className="px-4 py-3.5 text-right font-mono">Vaqt</th>
                      <th className="px-4 py-3.5 text-right">Ball</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leaderboard.slice(0, 7).map((entry, index) => (
                      <tr
                        key={index}
                        className={`hover:bg-[#ec4899]/5 transition duration-150 ${
                          index === 0 ? 'bg-[#ec4899]/10 text-white font-extrabold shadow-inner' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-center font-black">
                          {index === 0 ? '🏆 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : `${index + 1}`}
                        </td>
                        <td className={`px-4 py-3 font-black uppercase tracking-wide ${index === 0 ? 'text-amber-300' : 'text-white'}`}>
                          {entry.name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs font-extrabold text-[#22d3ee] tracking-tight uppercase">{entry.car}</span>
                            <span className="text-[10px] text-slate-400 font-mono italic">{entry.track}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-white">
                          {Math.floor(entry.time / 60)}:{(entry.time % 60).toFixed(2).padStart(5, '0')}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-[#ec4899] font-mono text-base tracking-tighter">
                          {entry.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab: General Game Instructions Card */}
        {activeTab === 'help' && (
          <div className="vibrant-glass rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6">
            <h2 className="text-2xl font-black text-[#22d3ee] flex items-center justify-center gap-2.5 text-center tracking-wider italic uppercase">
              <Gamepad2 className="w-6 h-6 animate-pulse text-[#22d3ee]" />
              O'YIN QOIDALARI VA BOSHQARUV
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/80 p-4.5 rounded-2xl border border-[#22d3ee]/30 shadow-inner">
                <h3 className="font-extrabold text-xs text-[#22d3ee] mb-3 flex items-center gap-1.5 uppercase tracking-widest font-mono">
                  <span>⌨️</span> Kompyuterda boshqarish
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-300 pl-1">
                  <li>• <b className="text-white bg-slate-900 px-1.5 py-0.5 rounded font-mono">W, S (↑, ↓)</b> - Tealashish / Gaz, Tormoz</li>
                  <li>• <b className="text-white bg-slate-900 px-1.5 py-0.5 rounded font-mono">A, D (←, →)</b> - Burilishlar (Rul boshqaruvi)</li>
                  <li>• <b className="text-[#f97316] bg-slate-900 px-1.5 py-0.5 rounded font-mono">Bo'shliq (Space)</b> - Nitro tezlashtiruvchi</li>
                  <li>• <b className="text-[#ec4899] bg-slate-900 px-1.5 py-0.5 rounded font-mono">Shift</b> - Drifting (Sliding / Skid)</li>
                  <li>• <b className="text-white bg-slate-905 px-1.5 py-0.5 rounded font-mono">Esc / P</b> - O'yinni to'xtatib turish</li>
                </ul>
              </div>

              <div className="bg-black/80 p-4.5 rounded-2xl border border-[#ec4899]/30 shadow-inner">
                <h3 className="font-extrabold text-xs text-[#ec4899] mb-3 flex items-center gap-1.5 uppercase tracking-widest font-mono">
                  <span>📱</span> Telefon / Planshetda
                </h3>
                <p className="text-xs text-slate-300 mb-2.5 leading-relaxed">
                  Mobil smartfonlarda ekranning pastki qismida silliq sensorli va sezgir tugmalar joylashadi:
                </p>
                <ul className="space-y-2 text-xs text-slate-400 pl-1">
                  <li>• <span className="text-white font-extrabold">Chap / O'ng strelkalar:</span> Chap tomonda rullash;</li>
                  <li>• <span className="text-white font-extrabold">GAZ, TORMOS va NITRO:</span> O'ng tarafdagi pedallar.</li>
                </ul>
              </div>
            </div>

            <div className="p-4.5 bg-black/60 border-2 border-white/5 rounded-2xl shadow-inner">
              <h3 className="font-extrabold text-xs text-amber-400 mb-2.5 flex items-center gap-1.5 uppercase tracking-widest font-mono">
                <Info className="w-4 h-4 text-amber-400" />
                PROFESSIONAL MASLAHATLAR
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>1. <b className="text-white">NITRO YIG'ING:</b> Yo'ldagi <span className="text-[#f97316] font-black uppercase">olovli butstlarni (nitro)</span> yig'ing va tezlikni absurd darajaga oshiring!</li>
                <li>2. <b className="text-white text-yellow-400 font-bold">ALTIN TANGALAR:</b> Yo'ldagi tangalar ballaringizni jadallik bilan oshirishga xizmat qiladi.</li>
                <li>3. <b className="text-[#ec4899] font-bold">DREIF REJIMINI YO'QOLTMANGLAR:</b> Yo'ldan chetga chiqish yoki to'siqlarga urilish poyga mashinasi tezligini 70% gacha pasaytiradi!</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer credits line as per system aesthetic guidelines */}
      <div className="text-center text-[10px] text-zinc-600 border-t border-white/5 pt-4 mt-auto font-mono tracking-widest uppercase">
        3D Moshina O'yini — Google AI Studio va WebGL yordamida loyihalashtirilgan.
      </div>
    </div>
  );
};
