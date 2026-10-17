/**
 * Internationalization (i18n) support for English and Korean.
 */

export type Language = 'ko' | 'en';

export const translations = {
  ko: {
    // Title Screen
    gameTitle: '프로스트 플로우',
    gameSubtitle: '포근한 겨울 제설 어드벤처',
    serviceDistrict: '산골 마을 겨울 도로 관리 · 제1구역',
    startCta: '제설 시작하기 [SPACE]',
    startCtaMobile: '제설 시작하기',
    bestScore: '최고 점수',
    controlHint: 'WASD / 방향키 운전 · Space 니트로 가속 · U 차고 · Esc / P 일시정지',
    titleDescription: '평화로운 겨울 마을의 눈길을 시원하게 밀어내고, 숨겨진 보물을 찾으며 콤보를 올려 제설차를 업그레이드하세요!',

    // HUD
    districtName: '알프스 파인즈 마을',
    goal: '목표',
    cleared: '제설 완료',
    pts: '점',
    coins: '프로스트 코인',
    garage: '차고 [U]',
    settings: '설정',
    speedKm: 'KM/H',
    nitro: '니트로 [SPACE]',
    nitroMobile: '니트로',
    flurryFrenzy: '눈보라 질주!',
    driftMaster: '드리프트 마스터!',
    snowShifter: '제설 전문가',
    cleanSweep: '쾌속 제설',
    cruising: '순항 중',

    // Upgrades Modal
    garageTitle: '마을 제설차 정비소',
    garageSubtitle: '획득한 코인으로 제설 장비를 업그레이드하여 더 넓고 빠르게 눈을 치우세요!',
    bladeName: '제설 블레이드',
    engineName: '트랙터 엔진',
    heaterName: '열선 스팀 블레이드',
    saltName: '염화칼슘 살포기',
    boostName: '니트로 터보 부스터',
    maxLevel: '최고 레벨',
    buyFor: '구매',
    coinsUnit: '코인',
    returnToPlow: '제설 계속하기 [ESC]',
    currentStats: '현재 성능',
    nextStats: '다음 단계',

    // Upgrade Tiers Descriptions
    tierBlade1: '표준 삽 (2.2m)',
    tierBlade1Desc: '마을 골목길과 진입로용 기본 강철 블레이드',
    tierBlade2: 'V자 윙 블레이드 (3.0m)',
    tierBlade2Desc: '양 날개가 넓어져 한 번에 많은 눈을 밀어냅니다.',
    tierBlade3: '대로변 고속 스위퍼 (3.8m)',
    tierBlade3Desc: '넓은 도로를 순식간에 청소하는 중장비 블레이드',
    tierBlade4: '초대형 블리자드 플로우 (4.8m)',
    tierBlade4Desc: '산악 폭설도 단숨에 뚫어내는 유압식 윙 블레이드',

    tierEngine1: '순정 디젤 (45 HP)',
    tierEngine1Desc: '한겨울에도 안정적으로 시동이 걸리는 기본 엔진',
    tierEngine2: '터보 차저 (75 HP)',
    tierEngine2Desc: '눈길 오르막 토크와 가속력 향상',
    tierEngine3: '알프스 고무 트랙 (110 HP)',
    tierEngine3Desc: '깊은 눈길에서도 미끄러지지 않는 드리프트 조향',
    tierEngine4: '하이퍼 트윈 V8 엔진',
    tierEngine4Desc: '폭설 속에서도 거침없는 최고 속도 발휘',

    tierHeater1: '일반 강철 날',
    tierHeater1Desc: '기계적 마찰로만 눈을 긁어냅니다.',
    tierHeater2: '온열 히팅 엣지',
    tierHeater2Desc: '날 끝이 따뜻해져 단단한 얼음층을 녹입니다 (+25% 보너스)',
    tierHeater3: '초고온 스팀 분사',
    tierHeater3Desc: '눈더미를 순간 기화시켜 추가 점수를 획득합니다 (+60% 보너스)',
    tierHeater4: '마그마 코일 블레이드',
    tierHeater4Desc: '어떤 빙판도 순식간에 녹여버리는 극한의 열선 (+100% 보너스)',

    tierSalt1: '미장착',
    tierSalt1Desc: '전방 블레이드로만 제설합니다.',
    tierSalt2: '중력식 호퍼 (1.8m)',
    tierSalt2Desc: '차량 뒤편으로 암염을 떨어뜨려 잔설을 융해합니다.',
    tierSalt3: '회전식 살포기 (3.2m)',
    tierSalt3Desc: '원심력으로 염화칼슘을 넓은 반경에 살포합니다.',
    tierSalt4: '급속 제설 브라인 캐논 (4.8m)',
    tierSalt4Desc: '지나간 도로 전체를 즉시 녹이는 액상 제설제 분사',

    tierBoost1: '기본 부스트 탱크',
    tierBoost1Desc: 'Space 키로 짧은 순간 속도 분사',
    tierBoost2: '대용량 인젝터',
    tierBoost2Desc: '부스터 충전 속도 +40% 및 지속력 증가',
    tierBoost3: '극저온 니트로 챔버',
    tierBoost3Desc: '강력한 드리프트 가속력 (+65% 속도)',
    tierBoost4: '영구 와류 제트 분사',
    tierBoost4Desc: '초고속 자동 충전 (+120% 충전 속도)',

    // Settings Modal
    settingsTitle: '환경 설정',
    languageSelect: '언어 설정 (Language)',
    soundSettings: '오디오 설정',
    bgmVolume: '배경 음악 (BGM)',
    sfxVolume: '효과음 (SFX)',
    muteAudio: '전체 음소거',
    controlsGuide: '조작 안내',
    controlsGuideDetail: 'W,A,S,D / 방향키: 주행 | Space: 니트로 | U: 차고 | Esc: 일시정지',
    boundaryNotice: '도로 경계 안내',
    boundaryNoticeDetail: '붉은색 반사 폴대와 통나무 안전 펜스 안쪽이 제설 구역입니다.',
    closeSettings: '닫기',

    // Pause Modal
    gamePaused: '일시 정지',
    pauseDesc: '난롯가에서 따뜻한 핫초코를 마시며 쉬어가는 중입니다.',
    resume: '게임 계속하기 [ESC]',
    restartDistrict: '구역 다시 시작 [R]',
    mainMenu: '메인 메뉴',
    unmute: '소리 켜기',
    mute: '음소거 [M]',

    // Victory Modal
    districtCleared: '구역 제설 완료!',
    victoryDesc: '제설차 덕분에 마을 주민들이 안전하게 다닐 수 있게 되었습니다!',
    finalScore: '최종 점수',
    frostCoins: '획득 코인',
    maxCombo: '최대 콤보',
    clearTime: '소요 시간',
    newBest: '★ 최고 기록 달성!',
    playAgain: '다시 플레이 [SPACE]',
    doubleCoinsAd: '광고 보고 코인 2배 받기',
    nextDistrict: '다음 구역으로 진출',
    coinsDoubled: '코인 2배 획득 완료!',

    // Monetization & Shop
    shop: '상점',
    shopTitle: '프로스트 상점 & VIP',
    shopSubtitle: '광고 제거, 멋진 제설차 스킨, 코인 충전소',
    tabIap: 'VIP & 패키지',
    tabSkins: '제설차 스킨',
    tabFreeCoins: '무료 충전',
    noAdsBadge: 'VIP 혜택',
    starterPackBadge: '스타터 특가',
    freeAdClaim: '광고 보고 +50 코인 받기',
    freeAdClaimDesc: '동영상 광고 1편 시청 시 50 코인 즉시 지급',
    equipped: '장착 중',
    equip: '장착',
    owned: '보유 중',
    buySkin: '구매',
    purchaseSuccess: '구매가 완료되었습니다!',
    skinDefault: '클래식 앰버',
    skinDefaultDesc: '마을 제설대의 든든하고 친숙한 기본 안전 주황색 제설차',
    skinGold: '24K 골든 블리자드',
    skinGoldDesc: '눈부신 순금으로 특수 코팅된 최고급 VIP 제설차',
    skinSanta: '산타 윈터 익스프레스',
    skinSantaDesc: '크리스마스 축제 분위기가 물씬 풍기는 루돌프 에디션 제설차',
    skinCyber: '사이버플로우 2077',
    skinCyberDesc: '미래형 옵시디언 바디와 네온 사이언 플라즈마 블레이드',

    // Daily Reward
    dailyReward: '출석 보너스',
    dailyRewardTitle: '7일간의 겨울 출석 보너스',
    dailyRewardSubtitle: '매일 접속하여 풍성한 코인과 특별 보상을 받으세요!',
    claimReward: '보상 받기',
    claimedToday: '오늘 보상 완료',
    dayLabel: '일차',

    // Lucky Wheel
    luckyWheel: '행운 룰렛',
    luckyWheelTitle: '행운의 겨울 룰렛',
    luckyWheelSubtitle: '룰렛을 돌려 잭팟 코인과 특별한 선물을 노려보세요!',
    spinFree: '무료 스핀 시작',
    spinAd: '광고 보고 무료 스핀',
    spinAgainAd: '광고 보고 1회 더 돌리기',
    spinCongrats: '🎉 축하합니다!',
    youWon: '획득한 선물:',
    claimPrize: '선물 받기',
    claimPrizeCoins: '코인 수령하기',
    claimedDone: '수령 완료!',
    spinning: '행운의 룰렛 회전 중...',
  },
  en: {
    // Title Screen
    gameTitle: 'FROST PLOW',
    gameSubtitle: 'COZY SNOW CLEARANCE',
    serviceDistrict: 'VILLAGE WINTER SERVICE · DISTRICT 1',
    startCta: 'START CLEARING [SPACE]',
    startCtaMobile: 'START CLEARING',
    bestScore: 'BEST SCORE',
    controlHint: 'WASD / Arrow Keys Drive · Space Nitro Boost · U Upgrade Garage · Esc / P Pause',
    titleDescription: 'Clear the peaceful winter streets, discover buried treasures, rack up high-speed flow combos, and upgrade your trusty plow!',

    // HUD
    districtName: 'ALPINE PINES',
    goal: 'GOAL',
    cleared: 'CLEARED',
    pts: 'PTS',
    coins: 'COINS',
    garage: 'GARAGE [U]',
    settings: 'SETTINGS',
    speedKm: 'KM/H',
    nitro: 'NITRO [SPACE]',
    nitroMobile: 'NITRO',
    flurryFrenzy: 'BLIZZARD BLITZ!',
    driftMaster: 'DRIFT MASTER!',
    snowShifter: 'SNOW SHIFTER',
    cleanSweep: 'CLEAN SWEEP',
    cruising: 'CRUISING',

    // Upgrades Modal
    garageTitle: 'VILLAGE PLOW GARAGE',
    garageSubtitle: 'Upgrade your equipment with earned Frost Coins to clear faster!',
    bladeName: 'Snow Blade',
    engineName: 'Tractor Engine',
    heaterName: 'Thermo-Melt Blade',
    saltName: 'Salt Spreader',
    boostName: 'Nitro Turbo Boost',
    maxLevel: 'MAX LEVEL',
    buyFor: 'BUY',
    coinsUnit: 'COINS',
    returnToPlow: 'RETURN TO PLOWING [ESC]',
    currentStats: 'Current',
    nextStats: 'Next',

    // Upgrade Tiers Descriptions
    tierBlade1: 'Steel Scoop (2.2m)',
    tierBlade1Desc: 'Standard plow blade for driveways and paths.',
    tierBlade2: 'V-Wing Blade (3.0m)',
    tierBlade2Desc: 'Expanded angled wings push more snow aside.',
    tierBlade3: 'Highway Sweeper (3.8m)',
    tierBlade3Desc: 'Heavy-duty steel clearing broad village avenues.',
    tierBlade4: 'Mega Blizzard Plow (4.8m)',
    tierBlade4Desc: 'Massive alpine clearing beast with hydraulic wings.',

    tierEngine1: 'Stock Diesel (45 HP)',
    tierEngine1Desc: 'Reliable cold-start tractor engine.',
    tierEngine2: 'Turbo Charger (75 HP)',
    tierEngine2Desc: 'Faster acceleration and responsive hill torque.',
    tierEngine3: 'Alpine Treads (110 HP)',
    tierEngine3Desc: 'Deep rubber winter tracks with agile drift turning.',
    tierEngine4: 'Hyper-Torque Twin-V8',
    tierEngine4Desc: 'Effortless speed through deep mountain powder.',

    tierHeater1: 'Unheated Steel',
    tierHeater1Desc: 'Relies solely on mechanical scraping.',
    tierHeater2: 'Heated Edge',
    tierHeater2Desc: 'Warm blade melts hard ice crusts (+25% bonus).',
    tierHeater3: 'Steam Jets',
    tierHeater3Desc: 'Blasts superheated steam into snowbanks (+60% bonus).',
    tierHeater4: 'Magma Coil Blade',
    tierHeater4Desc: 'Vaporizes packed snowdrifts in sizzling clouds (+100% bonus).',

    tierSalt1: 'No Spreader',
    tierSalt1Desc: 'Manual plowing only.',
    tierSalt2: 'Gravity Hopper (1.8m)',
    tierSalt2Desc: 'Scatters rock salt behind the plow to melt trailing snow.',
    tierSalt3: 'Rotary Spinner (3.2m)',
    tierSalt3Desc: 'Wide-arc centrifugal salt spreader.',
    tierSalt4: 'Cryo-Brine Cannon (4.8m)',
    tierSalt4Desc: 'Covers the street with premium fast-acting brine.',

    tierBoost1: 'Standard Boost Tank',
    tierBoost1Desc: 'Short speed surge on Spacebar.',
    tierBoost2: 'High-Flow Injector',
    tierBoost2Desc: 'Faster boost recharge (+40%) and longer duration.',
    tierBoost3: 'Cryo-Nitrous Chamber',
    tierBoost3Desc: 'Massive burst of drift acceleration (+65% speed).',
    tierBoost4: 'Perpetual Vortex Jet',
    tierBoost4Desc: 'Rapid auto-recharging rocket surge (+120% recharge).',

    // Settings Modal
    settingsTitle: 'GAME SETTINGS',
    languageSelect: 'Language (언어)',
    soundSettings: 'Audio & Music',
    bgmVolume: 'Music (BGM)',
    sfxVolume: 'Sound Effects (SFX)',
    muteAudio: 'Mute All Audio',
    controlsGuide: 'Controls Guide',
    controlsGuideDetail: 'WASD / Arrows: Steer & Drive | Space: Nitro Boost | U: Garage | Esc: Pause',
    boundaryNotice: 'Road Boundary Notice',
    boundaryNoticeDetail: 'Stay within the striped red snow poles and timber guardrails for optimal plowing.',
    closeSettings: 'Close',

    // Pause Modal
    gamePaused: 'GAME PAUSED',
    pauseDesc: 'Taking a warm hot cocoa break by the fire.',
    resume: 'RESUME [ESC]',
    restartDistrict: 'RESTART DISTRICT [R]',
    mainMenu: 'MAIN MENU',
    unmute: 'UNMUTE AUDIO',
    mute: 'MUTE AUDIO [M]',

    // Victory Modal
    districtCleared: 'DISTRICT CLEARED!',
    victoryDesc: 'The villagers can safely drive and walk thanks to your trusty plow!',
    finalScore: 'FINAL SCORE',
    frostCoins: 'FROST COINS',
    maxCombo: 'MAX COMBO',
    clearTime: 'CLEAR TIME',
    newBest: '★ NEW BEST!',
    playAgain: 'PLAY AGAIN [SPACE]',
    doubleCoinsAd: 'Watch Ad for 2x Coins',
    nextDistrict: 'Advance to Next District',
    coinsDoubled: 'Coins Doubled!',

    // Monetization & Shop
    shop: 'SHOP',
    shopTitle: 'FROST SHOP & VIP',
    shopSubtitle: 'No-Ads Pass, Vehicle Skins & Coin Store',
    tabIap: 'VIP & Bundles',
    tabSkins: 'Plow Skins',
    tabFreeCoins: 'Free Coins',
    noAdsBadge: 'VIP PERK',
    starterPackBadge: 'BEST VALUE',
    freeAdClaim: 'Watch Ad for +50 Coins',
    freeAdClaimDesc: 'Watch a short video ad to claim 50 Coins instantly',
    equipped: 'EQUIPPED',
    equip: 'EQUIP',
    owned: 'OWNED',
    buySkin: 'BUY',
    purchaseSuccess: 'Purchase completed successfully!',
    skinDefault: 'Classic Amber',
    skinDefaultDesc: 'The reliable and familiar village plow in high-visibility safety orange.',
    skinGold: '24K Golden Blizzard',
    skinGoldDesc: 'Prestige VIP plow coated in gleaming 24-karat alpine gold.',
    skinSanta: 'Santa Winter Express',
    skinSantaDesc: 'Festive Christmas Rudolph edition with candy-red chassis and snow-white blade.',
    skinCyber: 'CyberPlow 2077',
    skinCyberDesc: 'Futuristic obsidian chassis with neon cyan thermo-plasma blade.',

    // Daily Reward
    dailyReward: 'Daily Bonus',
    dailyRewardTitle: '7-Day Winter Login Bonus',
    dailyRewardSubtitle: 'Login every day to collect free coins and rare rewards!',
    claimReward: 'Claim Reward',
    claimedToday: 'Claimed Today',
    dayLabel: 'Day',

    // Lucky Wheel
    luckyWheel: 'Lucky Wheel',
    luckyWheelTitle: 'Lucky Winter Wheel',
    luckyWheelSubtitle: 'Spin the wheel for jackpot coins and special winter prizes!',
    spinFree: 'Start Free Spin',
    spinAd: 'Watch Ad for Free Spin',
    spinAgainAd: 'Watch Ad to Spin Again',
    spinCongrats: '🎉 Congratulations!',
    youWon: 'You Won:',
    claimPrize: 'Claim Prize',
    claimPrizeCoins: 'Claim Coins',
    claimedDone: 'Claimed!',
    spinning: 'Spinning Wheel...',
  },
};

export function getSavedLanguage(): Language {
  try {
    const saved = localStorage.getItem('frostplow_language');
    if (saved === 'en' || saved === 'ko') return saved;
    // Default to Korean if browser language is Korean
    if (typeof navigator !== 'undefined' && navigator.language?.startsWith('ko')) {
      return 'ko';
    }
  } catch {
    // Ignore
  }
  return 'ko'; // Default to Korean as requested by the user
}

export function saveLanguage(lang: Language) {
  try {
    localStorage.setItem('frostplow_language', lang);
  } catch {
    // Ignore
  }
}
