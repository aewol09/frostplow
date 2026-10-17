/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import type {
  GameState,
  PlayerUpgrades,
  ComboState,
  VehicleState,
  GameStats,
  UpgradeCategory,
  CollectibleItem,
  VehicleSkinId,
  LuckyWheelPrize,
  DailyRewardState,
} from './game/types.ts';
import {
  INITIAL_UPGRADES,
  INITIAL_COMBO,
  getUpgradeModifiers,
  updateCombo,
  calculateSnowScore,
  checkWinCondition,
  canAffordUpgrade,
  stepVehiclePhysics,
} from './game/rules.ts';
import { soundEngine } from './game/audio.ts';
import { SnowManager } from './game/snowGrid.ts';
import { WorldScene } from './game/worldScene.ts';
import { ControlsManager } from './game/controls.ts';
import { TitleScreen } from './components/TitleScreen.tsx';
import { GameHUD } from './components/GameHUD.tsx';
import { UpgradeModal } from './components/UpgradeModal.tsx';
import { ShopModal } from './components/ShopModal.tsx';
import { DailyRewardModal } from './components/DailyRewardModal.tsx';
import { LuckyWheelModal } from './components/LuckyWheelModal.tsx';
import { AdModal } from './components/AdModal.tsx';
import { PauseModal, VictoryModal } from './components/StatusModals.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import type { Language } from './game/i18n.ts';
import { getSavedLanguage, saveLanguage } from './game/i18n.ts';
import {
  DISTRICTS,
  VEHICLE_SKINS,
  monetizationService,
} from './game/monetization.ts';
import { admobManager } from './game/admob.ts';
import { billingService } from './game/billing.ts';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);

  // High-level UI state
  const [gameState, setGameState] = useState<GameState>('title');
  const [language, setLanguage] = useState<Language>(() => getSavedLanguage());
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showUpgrades, setShowUpgrades] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [upgrades, setUpgrades] = useState<PlayerUpgrades>(INITIAL_UPGRADES);

  // Monetization modals state
  const [showShop, setShowShop] = useState<boolean>(false);
  const [showDailyReward, setShowDailyReward] = useState<boolean>(false);
  const [showLuckyWheel, setShowLuckyWheel] = useState<boolean>(false);
  const [showAdModal, setShowAdModal] = useState<boolean>(false);
  const [adRewardInfo, setAdRewardInfo] = useState<{ title: string; onComplete: () => void } | null>(null);

  // Monetization profile state
  const [isNoAds, setIsNoAds] = useState<boolean>(() => monetizationService.isNoAds());
  const [ownedSkins, setOwnedSkins] = useState<VehicleSkinId[]>(() => monetizationService.getOwnedSkins());
  const [activeSkin, setActiveSkin] = useState<VehicleSkinId>(() => monetizationService.getActiveSkin());
  const [currentDistrictId, setCurrentDistrictId] = useState<number>(() => monetizationService.getCurrentDistrict());
  const [hasClaimedDoubleCoins, setHasClaimedDoubleCoins] = useState<boolean>(false);
  const [dailyRewardState, setDailyRewardState] = useState<DailyRewardState>(() => monetizationService.getDailyRewardState());
  const [canClaimDailyReward, setCanClaimDailyReward] = useState<boolean>(() => monetizationService.canClaimDailyReward());
  const [canSpinLuckyWheelFree, setCanSpinLuckyWheelFree] = useState<boolean>(() => monetizationService.canSpinLuckyWheelFree());

  // Current District configuration
  const currentDistrict = DISTRICTS.find((d) => d.id === currentDistrictId) || DISTRICTS[0];
  const targetPercentage = currentDistrict.targetPercent;

  // HUD stats throttled to React
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    coins: 10,
    totalClearedCells: 0,
    clearPercentage: 0,
    highestCombo: 1.0,
    runTimeSeconds: 0,
    itemsFound: 0,
    drivewaysCleared: 0,
  });

  const [comboState, setComboState] = useState<ComboState>(INITIAL_COMBO);
  const [vehicleDisplay, setVehicleDisplay] = useState<VehicleState>({
    x: 0,
    z: 0,
    angle: 0,
    speed: 0,
    steer: 0,
    isPlowing: false,
    isBoosting: false,
    boostCharge: 100,
    snowHopper: 0,
    maxHopper: 100,
  });

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('frostplow_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  // Mutable refs for zero-overhead 60 FPS simulation
  const runtimeRef = useRef({
    gameState: 'title' as GameState,
    snowManager: null as SnowManager | null,
    worldScene: null as WorldScene | null,
    controls: null as ControlsManager | null,
    vehicle: {
      x: 0,
      z: 0,
      angle: 0,
      speed: 0,
      steer: 0,
      isPlowing: false,
      isBoosting: false,
      boostCharge: 100,
      snowHopper: 0,
      maxHopper: 100,
    } as VehicleState,
    upgrades: INITIAL_UPGRADES,
    combo: INITIAL_COMBO,
    score: 0,
    coins: 10,
    highestCombo: 1.0,
    runTimeSeconds: 0,
    lastTime: performance.now(),
    lastHudUpdate: 0,
    animationFrameId: 0,
    lastPlowChimeMultiplier: 1.0,
    isNoAds: false,
  });

  // Keep runtime refs in sync with React state
  useEffect(() => {
    runtimeRef.current.gameState = gameState;
    document.body.dataset.state = gameState;
  }, [gameState]);

  useEffect(() => {
    runtimeRef.current.isNoAds = isNoAds;
  }, [isNoAds]);

  useEffect(() => {
    runtimeRef.current.upgrades = upgrades;
    if (runtimeRef.current.worldScene) {
      runtimeRef.current.worldScene.updateUpgradeVisuals(upgrades);
    }
  }, [upgrades]);

  useEffect(() => {
    if (runtimeRef.current.worldScene) {
      runtimeRef.current.worldScene.applyVehicleSkin(activeSkin);
    }
  }, [activeSkin]);

  // Initialize WebGL Scene and Game Loop
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const snowManager = new SnowManager();
    const controls = new ControlsManager();

    const worldScene = new WorldScene(mount, snowManager, {
      onCollectItem: (item: CollectibleItem) => {
        soundEngine.playItemSparkle();
        const coinGain = runtimeRef.current.isNoAds ? Math.round(item.value * 1.2) : item.value;
        runtimeRef.current.coins += coinGain;
        runtimeRef.current.score += item.value * 50;
      },
      onMelterDeposit: () => {
        soundEngine.playUpgradeSuccess();
        const coinGain = runtimeRef.current.isNoAds ? 30 : 25;
        runtimeRef.current.coins += coinGain;
        runtimeRef.current.score += 500;
      },
    });

    // Apply initial skin
    worldScene.applyVehicleSkin(activeSkin);

    runtimeRef.current.snowManager = snowManager;
    runtimeRef.current.worldScene = worldScene;
    runtimeRef.current.controls = controls;

    // Check for ?autostart=1 query param
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      runtimeRef.current.gameState = 'playing';
      setGameState('playing');
      soundEngine.resume();
    }

    // Window resize handler
    const handleResize = () => {
      if (mount && worldScene) {
        worldScene.resize(mount.clientWidth, mount.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));
    let lastRenderTime = 0;
    const headlessInterval = 1000 / 15;

    // Main 60 FPS Game Loop
    const tick = (now: number) => {
      if (isHeadless && now - lastRenderTime < headlessInterval) {
        runtimeRef.current.animationFrameId = requestAnimationFrame(tick);
        return;
      }
      lastRenderTime = now;

      const rawDt = (now - runtimeRef.current.lastTime) / 1000;
      runtimeRef.current.lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      const r = runtimeRef.current;
      const currentInputs = controls.getInputs();

      // Keyboard edge triggers
      if (currentInputs.justPressedStart) {
        if (r.gameState === 'title') {
          handleStart();
        } else if (r.gameState === 'gameover') {
          handleRestart();
        }
      }

      if (currentInputs.justPressedPause && r.gameState === 'playing') {
        setGameState('paused');
      } else if (currentInputs.justPressedPause && r.gameState === 'paused') {
        setGameState('playing');
      }

      if (currentInputs.justPressedUpgrades && r.gameState === 'playing') {
        setShowUpgrades((prev) => !prev);
      }

      if (currentInputs.justPressedMute) {
        const muted = soundEngine.toggleMute();
        setIsMuted(muted);
      }

      if (currentInputs.justPressedRestart && (r.gameState === 'playing' || r.gameState === 'paused')) {
        handleRestart();
      }

      // Active Simulation Step
      if (r.gameState === 'playing') {
        r.runTimeSeconds += dt;
        const mods = getUpgradeModifiers(r.upgrades);
        const bounds = { minX: -29.2, maxX: 29.2, minZ: -29.2, maxZ: 29.2 };

        // 1. Vehicle kinematics
        r.vehicle = stepVehiclePhysics(r.vehicle, currentInputs, mods, dt, bounds);

        // 2. Obstacle collision
        const col = snowManager.checkObstacleCollision(r.vehicle.x, r.vehicle.z, 1.3);
        if (col.collided) {
          r.vehicle.x += col.pushX;
          r.vehicle.z += col.pushZ;
          r.vehicle.speed *= 0.88;

          if (col.isMelter) {
            worldScene.emitPlowSnowParticles(r.vehicle.x, r.vehicle.z, r.vehicle.angle, 12);
          }
        }

        // 3. Snow clearance along plow blade
        const isMoving = Math.abs(r.vehicle.speed) > 0.4;
        let newlyCleared = 0;
        if (isMoving && r.vehicle.speed > 0) {
          newlyCleared = snowManager.sweepSnow(
            r.vehicle.x,
            r.vehicle.z,
            r.vehicle.angle,
            mods.bladeWidth,
            mods.saltRadius
          );
        }

        r.vehicle.isPlowing = newlyCleared > 0;

        // 4. Update Combo state
        r.combo = updateCombo(r.combo, newlyCleared, dt);
        if (r.combo.multiplier > r.highestCombo) {
          r.highestCombo = r.combo.multiplier;
        }

        // Sound: plowing crunch
        soundEngine.updatePlowingSound(
          r.vehicle.isPlowing,
          Math.abs(r.vehicle.speed) / mods.maxForwardSpeed
        );

        // Combo chime milestones
        if (
          r.combo.multiplier > r.lastPlowChimeMultiplier + 0.3 ||
          (r.combo.multiplier >= 2.0 && r.lastPlowChimeMultiplier < 2.0)
        ) {
          soundEngine.playComboChime(r.combo.multiplier);
          r.lastPlowChimeMultiplier = r.combo.multiplier;
        } else if (r.combo.multiplier === 1.0) {
          r.lastPlowChimeMultiplier = 1.0;
        }

        // Boost whoosh sound
        if (currentInputs.boost && r.vehicle.isBoosting && Math.random() < 0.05) {
          soundEngine.playBoostWhoosh();
        }

        // 5. Snow spray particles
        if (newlyCleared > 0) {
          worldScene.emitPlowSnowParticles(
            r.vehicle.x,
            r.vehicle.z,
            r.vehicle.angle,
            Math.min(newlyCleared * 2, 10)
          );
        }

        // 6. Score & Coins (VIP No-Ads gives +20% coin boost)
        if (newlyCleared > 0) {
          const { points, coins } = calculateSnowScore(
            newlyCleared,
            r.combo.multiplier,
            mods.meltBonusMultiplier
          );
          r.score += points;
          const finalCoins = r.isNoAds ? Math.round(coins * 1.2) : coins;
          r.coins += finalCoins;
        }

        // 7. Check win condition
        const win = checkWinCondition(
          snowManager.clearedSnowCells,
          snowManager.totalSnowCells,
          targetPercentage
        );

        if (win.isComplete && r.gameState === 'playing') {
          soundEngine.playVictoryFanfare();
          soundEngine.updatePlowingSound(false, 0);
          r.gameState = 'gameover';
          setGameState('gameover');
          setHasClaimedDoubleCoins(false);

          // Update high score
          setHighScore((prev) => {
            const nextBest = Math.max(prev, r.score);
            try {
              localStorage.setItem('frostplow_highscore', nextBest.toString());
            } catch {
              // ignore
            }
            return nextBest;
          });
        }

        // Throttle React state updates to ~12Hz
        if (now - r.lastHudUpdate > 80) {
          r.lastHudUpdate = now;
          setStats({
            score: r.score,
            coins: r.coins,
            totalClearedCells: snowManager.clearedSnowCells,
            clearPercentage: win.currentPercentage,
            highestCombo: r.highestCombo,
            runTimeSeconds: r.runTimeSeconds,
            itemsFound: 0,
            drivewaysCleared: 0,
          });
          setComboState(r.combo);
          setVehicleDisplay({ ...r.vehicle });
        }
      }

      // Render 3D Scene
      worldScene.update(r.vehicle, dt, r.gameState === 'title');

      r.animationFrameId = requestAnimationFrame(tick);
    };

    runtimeRef.current.animationFrameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(runtimeRef.current.animationFrameId);
      controls.dispose();
      worldScene.dispose();
      soundEngine.stopAll();
    };
  }, []);

  // Handlers
  const handleStart = () => {
    soundEngine.resume();
    runtimeRef.current.gameState = 'playing';
    setGameState('playing');
  };

  const handleRestart = () => {
    const r = runtimeRef.current;
    if (r.snowManager) {
      r.snowManager.reset();
    }
    r.score = 0;
    r.runTimeSeconds = 0;
    r.highestCombo = 1.0;
    r.combo = INITIAL_COMBO;
    r.lastPlowChimeMultiplier = 1.0;
    r.vehicle = {
      x: 0,
      z: 0,
      angle: 0,
      speed: 0,
      steer: 0,
      isPlowing: false,
      isBoosting: false,
      boostCharge: 100,
      snowHopper: 0,
      maxHopper: 100,
    };
    r.gameState = 'playing';
    setGameState('playing');
    setHasClaimedDoubleCoins(false);
    setShowUpgrades(false);
    setShowSettings(false);
    setShowShop(false);
    setShowDailyReward(false);
    setShowLuckyWheel(false);
  };

  const handleNextDistrict = () => {
    const nextId = Math.min(currentDistrictId + 1, DISTRICTS.length);
    monetizationService.setCurrentDistrict(nextId);
    setCurrentDistrictId(nextId);
    soundEngine.playVictoryFanfare();
    handleRestart();
  };

  const handleTitle = () => {
    soundEngine.updatePlowingSound(false, 0);
    runtimeRef.current.gameState = 'title';
    setGameState('title');
    setShowUpgrades(false);
    setShowSettings(false);
    setShowShop(false);
    setShowDailyReward(false);
    setShowLuckyWheel(false);
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectLanguage = (newLang: Language) => {
    setLanguage(newLang);
    saveLanguage(newLang);
  };

  const handleBuyUpgrade = (category: UpgradeCategory) => {
    const r = runtimeRef.current;
    const currentLevel = upgrades[category];
    const { canBuy, cost } = canAffordUpgrade(r.coins, category, currentLevel);
    if (!canBuy) return;

    soundEngine.playUpgradeSuccess();
    r.coins -= cost;
    const nextUpgrades = {
      ...upgrades,
      [category]: currentLevel + 1,
    };
    setUpgrades(nextUpgrades);
    setStats((prev) => ({ ...prev, coins: r.coins }));
  };

  // Monetization Handlers
  const handleBuyIAP = async (productId: string) => {
    // 1. If running on native Android device, invoke Google Play Billing
    if (billingService.isNativePlatform()) {
      const res = await monetizationService.purchaseProduct(productId);
      if (!res.success) {
        if (!res.cancelled && res.error) {
          alert(res.error);
        }
        return;
      }
    }

    // 2. Grant product only if purchase succeeded!
    soundEngine.playUpgradeSuccess();
    if (productId === 'frostplow.noads') {
      monetizationService.setNoAds(true);
      setIsNoAds(true);
      admobManager.hideBannerAd();
    } else if (productId === 'frostplow.starter') {
      monetizationService.addOwnedSkin('gold');
      setOwnedSkins(monetizationService.getOwnedSkins());
      monetizationService.setActiveSkin('gold');
      setActiveSkin('gold');
      runtimeRef.current.coins += 500;
      setStats((prev) => ({ ...prev, coins: runtimeRef.current.coins }));
    } else if (productId === 'frostplow.coins.100') {
      runtimeRef.current.coins += 100;
      setStats((prev) => ({ ...prev, coins: runtimeRef.current.coins }));
    } else if (productId === 'frostplow.coins.500') {
      runtimeRef.current.coins += 575;
      setStats((prev) => ({ ...prev, coins: runtimeRef.current.coins }));
    } else if (productId === 'frostplow.coins.1500') {
      runtimeRef.current.coins += 1950;
      setStats((prev) => ({ ...prev, coins: runtimeRef.current.coins }));
    }
  };

  const handleRestorePurchases = async () => {
    const res = await monetizationService.restorePurchases();
    soundEngine.playItemSparkle();
    setIsNoAds(res.restoredNoAds);
    setOwnedSkins(res.restoredSkins);
    alert(res.message);
  };

  const handleBuySkin = (skinId: VehicleSkinId) => {
    const skin = VEHICLE_SKINS[skinId];
    if (!skin || runtimeRef.current.coins < skin.priceCoins) return;

    soundEngine.playUpgradeSuccess();
    runtimeRef.current.coins -= skin.priceCoins;
    setStats((prev) => ({ ...prev, coins: runtimeRef.current.coins }));

    monetizationService.addOwnedSkin(skinId);
    setOwnedSkins(monetizationService.getOwnedSkins());
    monetizationService.setActiveSkin(skinId);
    setActiveSkin(skinId);
  };

  const handleEquipSkin = (skinId: VehicleSkinId) => {
    soundEngine.playItemSparkle();
    monetizationService.setActiveSkin(skinId);
    setActiveSkin(skinId);
  };

  const handleClaimDailyReward = () => {
    const res = monetizationService.claimDailyReward();
    soundEngine.playVictoryFanfare();
    runtimeRef.current.coins += res.coins;
    setStats((prev) => ({ ...prev, coins: runtimeRef.current.coins }));
    setDailyRewardState(monetizationService.getDailyRewardState());
    setCanClaimDailyReward(false);
  };

  const handleSpinWin = (prize: LuckyWheelPrize) => {
    soundEngine.playUpgradeSuccess();
    runtimeRef.current.coins += prize.coins;
    setStats((prev) => ({ ...prev, coins: runtimeRef.current.coins }));
    monetizationService.recordWheelSpin();
    setCanSpinLuckyWheelFree(monetizationService.canSpinLuckyWheelFree());
  };

  const requestRewardedAd = async (info: { title: string; onComplete: () => void }) => {
    // 1. If running inside Android Native App, show real Google AdMob ad
    if (admobManager.isNativeAdSupported()) {
      const shown = await admobManager.showRewardedAd(
        () => {
          info.onComplete();
        },
        () => {
          // If native ad failed to load/show (e.g. offline or no fill)
          alert(
            language === 'ko'
              ? 'Google AdMob 광고를 불러올 수 없습니다. 인터넷 연결을 확인하거나 잠시 후 다시 시도해 주세요.'
              : 'Unable to load Google AdMob ad. Please check your internet connection and try again.'
          );
        }
      );
      if (shown) return;
      alert(
        language === 'ko'
          ? 'Google AdMob 광고를 준비 중입니다. 잠시 후 다시 시도해 주세요.'
          : 'Google AdMob ad is preparing. Please try again in a moment.'
      );
      return;
    }

    // 2. Web browser only: Launch rich video commercial modal for desktop testing
    setAdRewardInfo(info);
    setShowAdModal(true);
  };

  const handleWatchAdForCoins = () => {
    requestRewardedAd({
      title: language === 'ko' ? '+50 코인 무료 충전' : '+50 Free Coins',
      onComplete: () => {
        soundEngine.playUpgradeSuccess();
        runtimeRef.current.coins += 50;
        setStats((prev) => ({ ...prev, coins: runtimeRef.current.coins }));
      },
    });
  };

  const handleWatchAdToSpin = () => {
    requestRewardedAd({
      title: language === 'ko' ? '행운의 룰렛 무료 스핀권' : 'Lucky Wheel Free Spin Ticket',
      onComplete: () => {
        soundEngine.playItemSparkle();
        setCanSpinLuckyWheelFree(true);
      },
    });
  };

  const handleDoubleCoinsAd = () => {
    const earnedThisRun = stats.coins;
    requestRewardedAd({
      title: language === 'ko' ? `구역 제설 코인 2배 보너스 (+${earnedThisRun} 코인)` : `2x Clear Coins Bonus (+${earnedThisRun} Coins)`,
      onComplete: () => {
        soundEngine.playVictoryFanfare();
        runtimeRef.current.coins += earnedThisRun;
        setStats((prev) => ({ ...prev, coins: runtimeRef.current.coins }));
        setHasClaimedDoubleCoins(true);
      },
    });
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-slate-950 font-sans select-none touch-none">
      {/* Three.js Canvas Mount */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0" />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStart}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenSettings={() => setShowSettings(true)}
          onOpenShop={() => setShowShop(true)}
          onOpenDailyReward={() => setShowDailyReward(true)}
          onOpenLuckyWheel={() => setShowLuckyWheel(true)}
          canClaimDailyReward={canClaimDailyReward}
          coins={stats.coins}
          highScore={highScore}
          language={language}
        />
      )}

      {/* In-Game HUD Overlay */}
      {gameState === 'playing' && (
        <GameHUD
          stats={stats}
          combo={comboState}
          vehicle={vehicleDisplay}
          targetPercentage={targetPercentage}
          districtName={currentDistrict.name}
          isMuted={isMuted}
          language={language}
          onToggleMute={handleToggleMute}
          onOpenUpgrades={() => setShowUpgrades(true)}
          onOpenShop={() => setShowShop(true)}
          onOpenSettings={() => setShowSettings(true)}
          onPause={() => setGameState('paused')}
          onTouchThrottle={(val) => runtimeRef.current.controls?.setTouchThrottle(val)}
          onTouchSteer={(val) => runtimeRef.current.controls?.setTouchSteer(val)}
          onTouchBoost={(val) => runtimeRef.current.controls?.setTouchBoost(val)}
        />
      )}

      {/* Upgrade Workshop Modal */}
      {showUpgrades && (
        <UpgradeModal
          upgrades={upgrades}
          coins={runtimeRef.current.coins}
          language={language}
          onBuyUpgrade={handleBuyUpgrade}
          onClose={() => setShowUpgrades(false)}
        />
      )}

      {/* In-Game Shop & VIP Modal */}
      {showShop && (
        <ShopModal
          coins={stats.coins}
          isNoAds={isNoAds}
          activeSkin={activeSkin}
          ownedSkins={ownedSkins}
          language={language}
          onBuyIAP={handleBuyIAP}
          onBuySkin={handleBuySkin}
          onEquipSkin={handleEquipSkin}
          onWatchAdForCoins={handleWatchAdForCoins}
          onRestorePurchases={handleRestorePurchases}
          onClose={() => setShowShop(false)}
        />
      )}

      {/* 7-Day Attendance Daily Reward Modal */}
      {showDailyReward && (
        <DailyRewardModal
          state={dailyRewardState}
          canClaimToday={canClaimDailyReward}
          language={language}
          onClaim={handleClaimDailyReward}
          onClose={() => setShowDailyReward(false)}
        />
      )}

      {/* Lucky Prize Wheel Modal */}
      {showLuckyWheel && (
        <LuckyWheelModal
          canSpinFree={canSpinLuckyWheelFree}
          language={language}
          onSpinWin={handleSpinWin}
          onWatchAdToSpin={handleWatchAdToSpin}
          onClose={() => setShowLuckyWheel(false)}
        />
      )}

      {/* Rewarded Ad Player Simulator Modal */}
      {showAdModal && adRewardInfo && (
        <AdModal
          rewardTitle={adRewardInfo.title}
          language={language}
          onAdCompleted={() => {
            adRewardInfo.onComplete();
            setShowAdModal(false);
            setAdRewardInfo(null);
          }}
          onClose={() => {
            setShowAdModal(false);
            setAdRewardInfo(null);
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          language={language}
          onSelectLanguage={handleSelectLanguage}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onRestart={handleRestart}
          onTitle={handleTitle}
          onOpenSettings={() => setShowSettings(true)}
          isMuted={isMuted}
          language={language}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Victory / District Cleared Modal */}
      {gameState === 'gameover' && (
        <VictoryModal
          stats={stats}
          highScore={highScore}
          language={language}
          hasClaimedDoubleCoins={hasClaimedDoubleCoins}
          isLastDistrict={currentDistrictId >= DISTRICTS.length}
          onDoubleCoinsAd={handleDoubleCoinsAd}
          onNextDistrict={handleNextDistrict}
          onPlayAgain={handleRestart}
          onTitle={handleTitle}
        />
      )}
    </div>
  );
}
