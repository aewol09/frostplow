<div align="center">

<img src="public/frostplow-feature-graphic-1024x500.png" alt="FrostPlow Banner" width="100%" />

# ❄️ 프로스트 플로우 (FrostPlow)
### Cozy 3D Snow Clearance Arcade Game for Android & Web

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black.svg)](https://threejs.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-7.6-blue.svg)](https://capacitorjs.com/)
[![Google Play](https://img.shields.io/badge/Google_Play-Ready-green.svg)](https://play.google.com/)

</div>

---

## 🎮 게임 소개 (About FrostPlow)

**프로스트 플로우 (FrostPlow)**는 포근하고 아름다운 겨울 마을을 배경으로 도로에 쌓인 눈을 시원하게 치우며 힐링하는 3D 캐주얼 제설 아케이드 게임입니다.

* **속 시원한 3D 제설 쾌감**: 실시간 Three.js 물리 엔진 기반으로 부드럽게 밀려나는 눈과 시원한 제설 이펙트
* **연속 콤보 & 블리자드 부스터**: 눈을 끊김 없이 연속으로 치우면 발동하는 초고속 부스터와 드리프트
* **정비소 업그레이드**: 최고 속도, 제설 블레이드 너비, 부스터 충전율, 적재량 강화
* **다양한 전용 스킨**: 클래식 옐로우, 빙하 블루, 네온 사이버, 로열 골드 에디션
* **수익화 및 스토어 준비 완료**: Google AdMob 공식 네이티브 광고(보상형/전면/배너), Google Play Billing 인앱 결제, 7일 출석 보상, 행운의 룰렛

---

## 📱 조작 방법 (Controls)

* **모바일 터치 조작 (Mobile)**:
  * **좌측 D-패드 (Left)**: `◀` 좌회전 / `▶` 우회전
  * **우측 페달 (Right)**: `GAS` 전진 가속 / `REV` 후진 및 브레이크 / `BOOST` 니트로 부스터
* **키보드 조작 (Desktop / Web)**:
  * `W` / `↑` : 전진
  * `S` / `↓` : 후진
  * `A` / `←` : 좌회전
  * `D` / `→` : 우회전
  * `Space` / `Shift` : 부스터
  * `U` : 정비소 업그레이드 / `P` : 일시정지 / `M` : 음소거

---

## 🛠️ 기술 스택 (Tech Stack)

* **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons
* **3D Graphics & Audio**: Three.js (WebGL), Web Audio Synthesizer Engine
* **Mobile Runtime**: Capacitor 7 (Android Native Platform)
* **Monetization**:
  * `@capacitor-community/admob` (Official Google Mobile Ads SDK)
  * `@capgo/native-purchases` (Official Google Play Billing Client)

---

## 🚀 로컬 실행 방법 (Run Locally)

```bash
# 1. 의존성 설치
npm install

# 2. 로컬 개발 서버 실행 (포트 3000)
npm run dev

# 3. 브라우저 접속
# http://localhost:3000
```

---

## 📦 안드로이드 빌드 (Android Build)

```bash
# 1. 웹 에셋 빌드 및 안드로이드 동기화
npm run build
npx cap sync android
node scripts/patch-java-version.js

# 2. APK 및 AAB 릴리즈 빌드 (Java 17 필요)
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
cd android
./gradlew assembleRelease bundleRelease

# 3. 빌드 결과물 (release/ 폴더)
# - release/frostplow-release.apk (스마트폰 테스트 설치용)
# - release/frostplow-release.aab (구글 플레이 콘솔 배포용 앱 번들)
```

---

## 📄 개인정보처리방침 (Privacy Policy)

Google Play 스토어 등록 및 검수 승인을 위한 개인정보처리방침 전문은 [PRIVACY_POLICY.md](PRIVACY_POLICY.md) 및 [public/privacy.html](public/privacy.html)을 참조하세요.

---

## 📄 라이선스 (License)

Apache License 2.0
