import React from 'react';
import { Play, Pause, RotateCcw, Volume2, Settings, Compass, Trophy, Zap, Gauge, Flame, Eye } from 'lucide-react';
import { GameSettings } from '../types';

interface HUDProps {
  score: number;
  speed: number; // simulated current km/h
  maxSpeed: number;
  nitroAmount: number; // 0 to 100
  nitroActive: boolean;
  distance: number; // current progress
  trackLength: number; // total progress
  time: number; // elapsed time
  isMobile: boolean;
  gameSettings: GameSettings;
  setGameSettings: (settings: GameSettings) => void;
  onPauseToggle: () => void;
  onRestart: () => void;
  onExitMenu: () => void;
  isPaused: boolean;
  onCameraChange: () => void;
  activeCamera: string;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  speed,
  maxSpeed,
  nitroAmount,
  nitroActive,
  distance,
  trackLength,
  time,
  isMobile,
  gameSettings,
  setGameSettings,
  onPauseToggle,
  onRestart,
  onExitMenu,
  isPaused,
  onCameraChange,
  activeCamera
}) => {
  const kmh = Math.round(speed);
  const progressRatio = Math.min(1, distance / trackLength);
  const remainingMeters = Math.max(0, Math.round(trackLength - distance));

  // Format time (MM:SS:CC)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-sans select-none z-10">
      {/* Top Bar Indicators */}
      <div className="flex justify-between items-start w-full">
        {/* Left Stats Block */}
        <div className="flex gap-3 pointer-events-auto">
          {/* Score Card */}
          <div className="bg-black/90 text-white border-2 border-[#ec4899] rounded-2xl px-5 py-2.5 flex items-center gap-3 backdrop-blur-md shadow-[0_0_15px_rgba(236,72,153,0.35)]">
            <Trophy className="text-[#ec4899] w-5 h-5 animate-bounce" />
            <div className="flex flex-col">
              <span className="text-[9px] text-pink-400 font-extrabold tracking-wider uppercase">REYTING SCORE</span>
              <span className="text-xl font-black font-mono tracking-tighter text-white">{score}</span>
            </div>
          </div>

          {/* Time Card */}
          <div className="bg-black/90 text-white border-2 border-[#22d3ee] rounded-2xl px-5 py-2.5 flex items-center gap-3 backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.35)]">
            <Compass className="text-[#22d3ee] w-5 h-5 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] text-[#22d3ee] font-extrabold tracking-wider uppercase">POYGA VAQTI</span>
              <span className="text-xl font-black font-mono tracking-tighter text-white">{formatTime(time)}</span>
            </div>
          </div>
        </div>

        {/* Center Progress Bar */}
        <div className="hidden md:flex flex-col items-center bg-black/90 px-6 py-2.5 border-2 border-[#22d3ee]/50 rounded-2xl text-white backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.2)] w-72">
          <div className="flex justify-between w-full text-[10px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">
            <span className="text-cyan-400">START</span>
            <span className="text-[#ec4899] font-bold">{remainingMeters} m qoldi</span>
            <span className="text-pink-400">FINISH</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden relative border border-white/10 p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-[#22d3ee] via-indigo-500 to-[#ec4899] rounded-full transition-all duration-100 relative"
              style={{ width: `${progressRatio * 100}%` }}
            >
              {/* Pulsing indicator at end of progress bar */}
              <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white animate-pulse" />
            </div>
          </div>
        </div>

        {/* Right Action Block */}
        <div className="flex gap-2 pointer-events-auto">
          {/* Camera Selector */}
          <button
            onClick={onCameraChange}
            id="btn-hud-camera"
            className="p-3 bg-black/90 hover:bg-[#22d3ee]/10 text-white border-2 border-[#22d3ee] rounded-2xl transition duration-300 active:scale-95 shadow-[0_0_12px_rgba(34,211,238,0.25)] flex items-center gap-2 cursor-pointer backdrop-blur-md font-bold uppercase tracking-wider text-xs"
            title="Kamera burchagini o'zgartirish"
          >
            <Eye className="w-5 h-5 text-[#22d3ee] animate-pulse" />
            <span className="text-[10px] font-black hidden sm:inline">{activeCamera === 'behind' ? 'Mashina orti' : activeCamera === 'hood' ? 'Kapot' : 'Tepadan'}</span>
          </button>

          {/* Pause Trigger */}
          <button
            onClick={onPauseToggle}
            id="btn-hud-pause"
            className="p-3 bg-black/90 hover:bg-red-500/10 text-white border-2 border-[#ec4899] rounded-2xl transition duration-300 active:scale-95 shadow-[0_0_12px_rgba(236,72,153,0.25)] cursor-pointer backdrop-blur-md"
          >
            {isPaused ? <Play className="w-5 h-5 text-emerald-400" /> : <Pause className="w-5 h-5 text-[#ec4899] animate-pulse" />}
          </button>
        </div>
      </div>

      {/* Progress slider on mobile */}
      <div className="flex md:hidden flex-col items-center bg-black/90 px-4 py-2.5 border-2 border-[#22d3ee]/60 rounded-2xl text-white backdrop-blur-md shadow-lg mx-auto w-11/12 my-2 pointer-events-auto">
        <div className="flex justify-between w-full text-[9px] text-slate-400 mb-1.5 font-black uppercase tracking-widest">
          <span className="text-cyan-400">START</span>
          <span className="text-[#ec4899]">{remainingMeters} m qoldi</span>
          <span className="text-pink-400">FINISH</span>
        </div>
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-[1px]">
          <div
            className="h-full bg-gradient-to-r from-[#22d3ee] to-[#ec4899] rounded-full transition-all duration-100"
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>
      </div>

      {/* Bottom Bar Controls and Speedometer */}
      <div className="flex justify-between items-end w-full mt-auto">
        {/* Mobile controls (Left & Right Steer) */}
        {isMobile ? (
          <div className="flex gap-4 p-2 pointer-events-auto">
            <button
              id="btn-mobile-left"
              onTouchStart={() => window.dispatchEvent(new CustomEvent('mobile-steer', { detail: -1 }))}
              onTouchEnd={() => window.dispatchEvent(new CustomEvent('mobile-steer', { detail: 0 }))}
              className="w-16 h-16 bg-black/90 border-2 border-[#22d3ee] active:bg-[#22d3ee]/20 active:border-white text-white rounded-2xl flex items-center justify-center font-black text-3xl shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-transform active:scale-90 touch-none cursor-pointer"
            >
              ←
            </button>
            <button
              id="btn-mobile-right"
              onTouchStart={() => window.dispatchEvent(new CustomEvent('mobile-steer', { detail: 1 }))}
              onTouchEnd={() => window.dispatchEvent(new CustomEvent('mobile-steer', { detail: 0 }))}
              className="w-16 h-16 bg-black/90 border-2 border-[#22d3ee] active:bg-[#22d3ee]/20 active:border-white text-white rounded-2xl flex items-center justify-center font-black text-3xl shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-transform active:scale-90 touch-none cursor-pointer"
            >
              →
            </button>
          </div>
        ) : (
          <div className="text-white bg-black/90 rounded-2xl px-5 py-3 border-2 border-white/5 text-[11px] hidden sm:flex flex-col gap-1.5 backdrop-blur-md shadow-lg">
            <div className="font-extrabold text-[10px] text-[#22d3ee] tracking-widest uppercase mb-0.5">BOSHQARUV KALITLARI:</div>
            <div>• <span className="font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-white font-bold">W, S, A, D</span> yoki <span className="font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-white font-bold">← ↑ ↓ →</span></div>
            <div>• <span className="font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-orange-400 font-extrabold uppercase">Space (Bo'shliq)</span> - NITRO portlashi!</div>
            <div>• <span className="font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-pink-400 font-extrabold uppercase">Shift</span> - Dreif va drift tormozi</div>
          </div>
        )}

        {/* Center: Analog / Digital Speedometer (Stunning design) */}
        <div className="flex items-center gap-4 bg-black/95 border-2 border-[#22d3ee] rounded-2xl py-3 px-5 text-white backdrop-blur-md shadow-[0_0_25px_rgba(34,211,238,0.25)] pointer-events-auto">
          {/* Speed Round indicator */}
          <div className="relative w-16 h-16 flex items-center justify-center border-4 border-slate-900 bg-radial-[circle_at_center,black_40%,rgba(34,211,238,0.1)_100%] rounded-full">
            {/* Speedometer line based on percentage of maxSpeed */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="#111"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke={nitroActive ? '#ec4899' : '#22d3ee'}
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="163"
                strokeDashoffset={163 - (163 * Math.min(speed, maxSpeed)) / maxSpeed}
                className="transition-all duration-100 progress-stroke"
              />
            </svg>
            <div className="flex flex-col items-center justify-center">
              <span className="text-2xl font-black font-mono leading-none tracking-tighter italic">{kmh}</span>
              <span className="text-[8px] font-black text-slate-400 uppercase leading-none mt-1 shadow-xs">KM/S</span>
            </div>
          </div>

          {/* Nitro Tank and active stats */}
          <div className="flex flex-col w-36 justify-center">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-300 tracking-wider mb-1">
              <span className="flex items-center gap-1 uppercase">
                <Flame className={`w-3.5 h-3.5 ${nitroAmount > 15 ? 'text-orange-500 animate-pulse' : 'text-slate-500'}`} />
                NITRO TANK
              </span>
              <span className={nitroActive ? 'text-pink-400 animate-pulse font-mono font-black' : 'font-mono font-black text-[#22d3ee]'}>{Math.round(nitroAmount)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-[1.5px]">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  nitroActive
                    ? 'bg-gradient-to-r from-pink-500 via-amber-400 to-rose-500 animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.8)]'
                    : nitroAmount > 30
                    ? 'bg-gradient-to-r from-cyan-500 to-[#22d3ee] shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                }`}
                style={{ width: `${nitroAmount}%` }}
              />
            </div>
            {/* Speed scale status */}
            <span className="text-[8px] text-slate-400 font-extrabold text-right mt-1 tracking-widest uppercase font-mono">
              {nitroActive ? "TEZLIK PORTLASHI" : kmh > 140 ? "DANGER SPEED" : kmh > 60 ? "O'RTACHA TEZLIK" : "SEKIN HAYDASH"}
            </span>
          </div>
        </div>

        {/* Mobile controls (Right Gas, Brake, Nitro) */}
        {isMobile && (
          <div className="flex gap-3 p-2 pointer-events-auto">
            {/* Nitro */}
            <button
              id="btn-mobile-nitro"
              onTouchStart={() => window.dispatchEvent(new CustomEvent('mobile-nitro', { detail: true }))}
              onTouchEnd={() => window.dispatchEvent(new CustomEvent('mobile-nitro', { detail: false }))}
              className={`w-14 h-14 border-2 rounded-2xl flex items-center justify-center font-bold text-white shadow-xl transition-all touch-none cursor-pointer ${
                nitroAmount > 5
                  ? 'bg-gradient-to-br from-orange-600 to-amber-500 border-amber-300 animate-pulse'
                  : 'bg-slate-800 border-slate-600 opacity-40'
              }`}
            >
              <Zap className="w-7 h-7 fill-current" />
            </button>

            {/* Brake */}
            <button
              id="btn-mobile-brake"
              onTouchStart={() => window.dispatchEvent(new CustomEvent('mobile-pedals', { detail: { gas: false, brake: true } }))}
              onTouchEnd={() => window.dispatchEvent(new CustomEvent('mobile-pedals', { detail: { gas: false, brake: false } }))}
              className="w-14 h-14 bg-red-800 border-2 border-red-900 active:bg-rose-600 text-white rounded-2xl flex flex-col items-center justify-center font-bold text-xs shadow-xl transition-all touch-none cursor-pointer"
            >
              🛑
              <span className="text-[8px] mt-0.5"> тормоз</span>
            </button>

            {/* Gas */}
            <button
              id="btn-mobile-gas"
              onTouchStart={() => window.dispatchEvent(new CustomEvent('mobile-pedals', { detail: { gas: true, brake: false } }))}
              onTouchEnd={() => window.dispatchEvent(new CustomEvent('mobile-pedals', { detail: { gas: false, brake: false } }))}
              className="w-16 h-16 bg-green-600 border-2 border-green-700 active:bg-emerald-400 text-white rounded-2xl flex flex-col items-center justify-center font-bold shadow-xl transition-all touch-none cursor-pointer"
            >
              ⚡
              <span className="text-[10px] font-black uppercase">GAZ</span>
            </button>
          </div>
        )}
      </div>

      {/* Pause Menu Modal Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 pointer-events-auto">
          <div className="secondary-glass rounded-3xl p-8 max-w-md w-full shadow-[0_0_35px_rgba(236,72,153,0.3)] m-4 relative overflow-hidden text-white font-sans border-2 border-[#ec4899]/70">
            {/* Top accent beam */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ec4899] via-[#a855f7] to-[#22d3ee]" />
            
            <h2 className="text-3xl font-black text-center text-white mb-6 uppercase tracking-wider flex items-center justify-center gap-2.5 font-sans italic">
              <Pause className="w-8 h-8 text-[#ec4899] animate-pulse" />
              PAUZA REJIMI
            </h2>

            <div className="space-y-6">
              {/* Settings Segment */}
              <div className="space-y-4 bg-black/80 p-4.5 rounded-2xl border-2 border-white/5 shadow-inner">
                <h3 className="text-xs font-black text-[#22d3ee] tracking-widest flex items-center gap-2 uppercase font-mono">
                  <Settings className="w-4 h-4 text-[#22d3ee]" />
                  SOZLAMALAR
                </h3>

                {/* Music Volume Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-slate-300 font-bold uppercase tracking-wider">
                    <span>Musiqa ovozi</span>
                    <span className="text-[#ec4899] font-mono font-black">{Math.round(gameSettings.musicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={gameSettings.musicVolume}
                    onChange={(e) => setGameSettings({ ...gameSettings, musicVolume: parseFloat(e.target.value) })}
                    className="w-full accent-[#ec4899] cursor-pointer h-2 bg-slate-900 rounded-lg appearance-none"
                  />
                </div>

                {/* SFX Volume Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-slate-300 font-bold uppercase tracking-wider">
                    <span>Effektlar ovozi</span>
                    <span className="text-[#22d3ee] font-mono font-black">{Math.round(gameSettings.sfxVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={gameSettings.sfxVolume}
                    onChange={(e) => setGameSettings({ ...gameSettings, sfxVolume: parseFloat(e.target.value) })}
                    className="w-full accent-[#22d3ee] cursor-pointer h-2 bg-slate-900 rounded-lg appearance-none"
                  />
                </div>

                {/* Auto Gas Toggle */}
                <div className="flex justify-between items-center pt-1 border-t border-white/5">
                  <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Avtomatik gaz</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gameSettings.autoGas}
                      onChange={(e) => setGameSettings({ ...gameSettings, autoGas: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ec4899]"></div>
                  </label>
                </div>

                {/* Graphics Mode Select */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Grafika sifati</span>
                  <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => setGameSettings({ ...gameSettings, graphics: 'low' })}
                      className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        gameSettings.graphics === 'low' ? 'bg-[#ec4899] text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      PAST
                    </button>
                    <button
                      onClick={() => setGameSettings({ ...gameSettings, graphics: 'high' })}
                      className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        gameSettings.graphics === 'high' ? 'bg-[#22d3ee] text-black shadow-md font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      YUQORI
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={onPauseToggle}
                  className="w-full py-4 bg-gradient-to-r from-[#22d3ee] to-[#ec4899] text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition duration-300 active:scale-98 shadow-[0_0_20px_rgba(236,72,153,0.4)] cursor-pointer italic"
                >
                  <Play className="w-5 h-5 fill-current animate-pulse" />
                  DAVOM ETTIRISH
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onRestart}
                    className="py-3 bg-zinc-950 border border-white/5 hover:border-[#22d3ee]/80 text-[#22d3ee] rounded-xl font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-xs"
                  >
                    <RotateCcw className="w-4 h-4 text-[#22d3ee]" />
                    RESTART
                  </button>

                  <button
                    onClick={onExitMenu}
                    className="py-3 bg-zinc-950 border border-white/5 hover:border-[#ec4899]/80 text-[#ec4899] rounded-xl font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-xs"
                  >
                    CHIQISH
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
