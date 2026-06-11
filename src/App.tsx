import { useState, useEffect } from 'react';
import { GameState, LeaderboardEntry, CarConfig, TrackConfig, GameSettings } from './types';
import { Menu } from './components/Menu';
import { HUD } from './components/HUD';
import { GameCanvas } from './components/GameCanvas';
import { gameAudio } from './audio';
import { Trophy, Clock, Flag, RotateCcw, Home, Gift } from 'lucide-react';

const CAR_OPTIONS: CarConfig[] = [
  {
    id: 'nexia',
    name: 'Nexia-3 "Bullet"',
    color: '#eab308', // Gold Yellow
    secondaryColor: '#1d4ed8', // Dark Blue
    speed: 1.25,
    acceleration: 1.1,
    handling: 0.85,
    nitro: 1.1,
    price: 0,
    unlocked: true,
    description: "Ishonchli va tezkor afsona. Tezligi va drifti yaxshi."
  },
  {
    id: 'cobalt',
    name: 'Cobalt "Urban"',
    color: '#cbd5e1', // Silver Gray
    secondaryColor: '#0f172a', // Dark Steel
    speed: 1.15,
    acceleration: 1.3,
    handling: 1.05,
    nitro: 1.0,
    price: 0,
    unlocked: true,
    description: "Shahar ko'chalarida mukammal va silliq boshqaruvga ega."
  },
  {
    id: 'gentra',
    name: 'Gentra "Tuning"',
    color: '#09090b', // Deep Matte Black
    secondaryColor: '#dc2626', // Red trim
    speed: 1.35,
    acceleration: 1.2,
    handling: 0.9,
    nitro: 1.3,
    price: 0,
    unlocked: true,
    description: "G'ildirakli hayvon. Yuqori tezlik va super nitro kuchi."
  },
  {
    id: 'malibu',
    name: 'Malibu "Turbo"',
    color: '#1e3a8a', // Indigo Blue
    secondaryColor: '#ca8a04', // Gold chrome
    speed: 1.5,
    acceleration: 1.4,
    handling: 0.8,
    nitro: 1.2,
    price: 0,
    unlocked: true,
    description: "Premium o'ta yuqori tezlashtirilgan flagman poygachi."
  }
];

const TRACK_OPTIONS: TrackConfig[] = [
  {
    id: 'city',
    name: 'Toshkent Oqshomi',
    color: '#14532d', // Grass green shoulders
    skyColor: '#f97316', // Sunset orange skies
    fogColor: '#ffedd5', // Sunbeam dust
    length: 1600,
    difficulty: 'Oson',
    lanes: 3,
    curveIntensity: 0.45,
    description: "Tinchgina shahar ko'chalari va ajoyib quyosh botishi manzarasi."
  },
  {
    id: 'desert',
    name: 'Qizilqum Sahrosi',
    color: '#78350f', // Sand amber shoulders
    skyColor: '#fdba74', // Dusty sky
    fogColor: '#fed7aa', // Sand fog
    length: 2200,
    difficulty: 'O\'rtacha',
    lanes: 3,
    curveIntensity: 0.75,
    description: "Kaktuslar, qum barxanlari va drayvli o'tkir burilishli drift trassasi."
  },
  {
    id: 'neon',
    name: 'Kiber Chilonzor',
    color: '#701a75', // Purple neon shoulders
    skyColor: '#0c0a09', // Pitch black sky
    fogColor: '#020617', // Neon indigo glow
    length: 2800,
    difficulty: 'Qiyin',
    lanes: 3,
    curveIntensity: 1.15,
    description: "Tungi neon chiroqlari va futuristik kiber-pank ko'chalar poygasi."
  }
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  
  // Game state variables
  const [selectedCarId, setSelectedCarId] = useState<string>('nexia');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('city');
  const [driverName, setDriverName] = useState<string>('');
  
  // HUD variables
  const [score, setScore] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [nitroAmount, setNitroAmount] = useState<number>(100);
  const [nitroActive, setNitroActive] = useState<boolean>(false);
  const [distance, setDistance] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  
  const [activeCamera, setActiveCamera] = useState<string>('behind');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Highscores and settings
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [bestScore, setBestScore] = useState<number>(0);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    musicVolume: 0.6,
    sfxVolume: 0.7,
    autoGas: false,
    graphics: 'high'
  });

  // End game summary stats
  const [gameOverStats, setGameOverStats] = useState<{
    score: number;
    time: number;
    won: boolean;
  } | null>(null);

  // Determine if portable device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Load Local Data
    const storedLeaderboard = localStorage.getItem('poyga_leaderboard');
    if (storedLeaderboard) {
      try {
        const parsed = JSON.parse(storedLeaderboard);
        setLeaderboard(parsed);
        if (parsed.length > 0) {
          const maxVal = Math.max(...parsed.map((item: any) => item.score));
          setBestScore(maxVal);
        }
      } catch (e) {
        console.error(e);
      }
    }

    const storedName = localStorage.getItem('poygachi_ismi');
    if (storedName) {
      setDriverName(storedName);
    } else {
      setDriverName("Poygachi_" + Math.floor(100 + Math.random() * 900));
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update sound engine on volume settings change
  useEffect(() => {
    gameAudio.setSfxVolume(gameSettings.sfxVolume);
    gameAudio.setMusicVolume(gameSettings.musicVolume);
  }, [gameSettings.sfxVolume, gameSettings.musicVolume]);

  const activeCar = CAR_OPTIONS.find(c => c.id === selectedCarId) || CAR_OPTIONS[0];
  const activeTrack = TRACK_OPTIONS.find(r => r.id === selectedTrackId) || TRACK_OPTIONS[0];

  const handleStartGame = () => {
    // Save driver name
    localStorage.setItem('poygachi_ismi', driverName);
    
    // Clear previous values
    setScore(0);
    setSpeed(0);
    setNitroAmount(100);
    setNitroActive(false);
    setDistance(0);
    setTime(0);
    setGameOverStats(null);
    
    // Request AudioContext activation
    gameAudio.resumeContext();
    gameAudio.setSfxVolume(gameSettings.sfxVolume);
    gameAudio.setMusicVolume(gameSettings.musicVolume);

    setGameState('PLAYING');
  };

  const handlePauseToggle = () => {
    setGameState(prev => {
      const targetState = prev === 'PLAYING' ? 'PAUSED' : 'PLAYING';
      if (targetState === 'PLAYING') {
        gameAudio.resumeContext();
        gameAudio.startEngine();
        if (gameSettings.musicVolume > 0) {
          gameAudio.startMusic();
        }
      } else {
        gameAudio.stopEngine();
        gameAudio.stopMusic();
      }
      return targetState;
    });
  };

  const handleGameOver = (finalScore: number, elapsedTime: number, won: boolean) => {
    setGameState('GAMEOVER');
    setGameOverStats({ score: finalScore, time: elapsedTime, won });

    // Save Score to Leaderboard
    const newEntry: LeaderboardEntry = {
      name: driverName || 'Noma\'lum',
      score: finalScore,
      time: elapsedTime,
      car: activeCar.name,
      track: activeTrack.name,
      date: new Date().toLocaleDateString()
    };

    const updatedLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Keep top 10

    setLeaderboard(updatedLeaderboard);
    localStorage.setItem('poyga_leaderboard', JSON.stringify(updatedLeaderboard));

    const maxVal = Math.max(...updatedLeaderboard.map(item => item.score));
    setBestScore(maxVal);
  };

  const handleRestart = () => {
    handleStartGame();
  };

  const handleExitMenu = () => {
    gameAudio.stopEngine();
    gameAudio.stopMusic();
    setGameState('MENU');
  };

  const handleCameraChange = () => {
    setActiveCamera(prev => {
      if (prev === 'behind') return 'hood';
      if (prev === 'hood') return 'top';
      return 'behind';
    });
  };

  // Format MM:SS
  const formatFinishTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D Game Canvas Layer */}
      {gameState !== 'MENU' && (
        <GameCanvas
          selectedCar={activeCar}
          selectedTrack={activeTrack}
          gameSettings={gameSettings}
          isPaused={gameState === 'PAUSED'}
          gameState={gameState}
          onGameOver={handleGameOver}
          onScoreUpdate={setScore}
          onSpeedUpdate={setSpeed}
          onNitroUpdate={setNitroAmount}
          onDistanceUpdate={setDistance}
          onTimeUpdate={setTime}
          nitroActive={nitroActive}
          setNitroActive={setNitroActive}
          activeCamera={activeCamera}
        />
      )}

      {/* Head-Up Display Layer */}
      {gameState === 'PLAYING' || gameState === 'PAUSED' ? (
        <HUD
          score={score}
          speed={speed}
          maxSpeed={activeCar.speed * 110}
          nitroAmount={nitroAmount}
          nitroActive={nitroActive}
          distance={distance}
          trackLength={activeTrack.length}
          time={time}
          isMobile={isMobile}
          gameSettings={gameSettings}
          setGameSettings={setGameSettings}
          onPauseToggle={handlePauseToggle}
          onRestart={handleRestart}
          onExitMenu={handleExitMenu}
          isPaused={gameState === 'PAUSED'}
          onCameraChange={handleCameraChange}
          activeCamera={activeCamera}
        />
      ) : null}

      {/* Main Start Menu Layer */}
      {gameState === 'MENU' && (
        <Menu
          cars={CAR_OPTIONS}
          selectedCarId={selectedCarId}
          setSelectedCarId={setSelectedCarId}
          tracks={TRACK_OPTIONS}
          selectedTrackId={selectedTrackId}
          setSelectedTrackId={setSelectedTrackId}
          leaderboard={leaderboard}
          driverName={driverName}
          setDriverName={setDriverName}
          onStartGame={handleStartGame}
          bestScore={bestScore}
        />
      )}

      {/* Game Over Layer Modal popup (stunning dark panel with glass glow) */}
      {gameState === 'GAMEOVER' && gameOverStats && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-30 p-4 animate-fade-in">
          <div className="secondary-glass border-2 border-[#ec4899] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_35px_rgba(236,72,153,0.35)] relative overflow-hidden text-center">
            {/* Top thematic glow */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${gameOverStats.won ? 'bg-gradient-to-r from-[#22d3ee] to-[#ec4899]' : 'bg-red-500'}`} />

            {/* Glowing Trophy / Flag layout */}
            <div className="my-5 flex justify-center">
              {gameOverStats.won ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full" />
                  <Trophy className="w-16 h-16 text-yellow-400 relative animate-bounce" />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-red-400/20 blur-2xl rounded-full" />
                  <Flag className="w-16 h-16 text-[#ec4899] relative animate-pulse" />
                </div>
              )}
            </div>

            <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-1 italic font-sans animate-pulse">
              {gameOverStats.won ? 'MARRAGA ETDINGIZ!' : 'SAYOHAT YAKUNLANDI'}
            </h2>
            <p className="text-xs text-pink-400 font-semibold mb-6 tracking-wide uppercase">
              {gameOverStats.won ? "Tabriklaymiz, ajoyib poyga namoyish etdingiz!" : "Qayta urinish orqali marraga yetib oling!"}
            </p>

            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 bg-black/85 p-4.5 rounded-2xl border border-white/5 shadow-inner">
              {/* Score */}
              <div className="text-left">
                <span className="text-[10px] text-[#22d3ee] font-black uppercase tracking-wider block">YIG'ILGAN BALL</span>
                <span className="text-xl font-extrabold text-[#22d3ee] font-mono tracking-tighter">{gameOverStats.score}</span>
              </div>

              {/* Time */}
              <div className="text-left border-l border-white/10 pl-4">
                <span className="text-[10px] text-pink-400 font-black uppercase tracking-wider block">SARFLANGAN VAQT</span>
                <span className="text-xl font-extrabold text-white font-mono tracking-tighter">
                  {formatFinishTime(gameOverStats.time)}
                </span>
              </div>

              {/* Chosen Car */}
              <div className="text-left pt-2.5 mt-2.5 border-t border-white/10 col-span-2 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-500 font-black tracking-wider uppercase block">POYGA MASHINASI</span>
                  <span className="text-xs font-black uppercase text-indigo-300">{activeCar.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 font-black tracking-wider uppercase block">TRASSA</span>
                  <span className="text-xs font-black uppercase text-orange-400">{activeTrack.name}</span>
                </div>
              </div>
            </div>

            {/* New personal record label */}
            {gameOverStats.score >= bestScore && gameOverStats.score > 0 && (
              <div className="mb-6 py-2.5 px-3 bg-[#ec4899]/15 border border-[#ec4899]/30 rounded-xl text-xs text-pink-300 font-black animate-pulse uppercase tracking-wider flex items-center justify-center gap-2">
                <Gift className="w-4 h-4 text-[#ec4899] fill-current animate-bounce" />
                Yangi SHAXSIY REKORD O'RNATILDI!
              </div>
            )}

            {/* Quick action buttons map */}
            <div className="space-y-3">
              <button
                onClick={handleRestart}
                className="w-full relative group py-4 bg-gradient-to-r from-[#22d3ee] via-purple-600 to-[#ec4899] text-white rounded-2xl font-black text-xs tracking-widest flex items-center justify-center gap-2 transition duration-200 active:scale-98 cursor-pointer overflow-hidden uppercase italic shadow-[0_0_15px_rgba(236,72,153,0.3)]"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] group-hover:animate-shine duration-1000" />
                <RotateCcw className="w-5 h-5" />
                QAYTA BOSHLASH
              </button>

              <button
                onClick={handleExitMenu}
                className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-white/5 hover:border-[#22d3ee]/80 text-[#22d3ee] rounded-xl font-extrabold text-xs tracking-widest uppercase transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4 text-[#22d3ee]" />
                ASOSIY MENYUGA QAYTISH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
