# Planner-app

뽀모도로 · 투두 · 스탬프 · 캘린더 · 위클리 · 디데이를 담은 안드로이드 플래너 앱 (Tauri 2 + Svelte).

## 설치

1. 폰에서 이 저장소의 **Releases** 최신 버전에 들어가 `Planner.apk`를 받아요.
2. 받은 파일을 열고, "출처를 알 수 없는 앱" 설치를 허용해요.
3. 새 버전도 같은 방법으로 설치하면 기존 데이터는 그대로 유지돼요. (앱을 **삭제**하면 데이터도 지워져요.)

## 데이터

모든 데이터는 폰 안의 앱 전용 저장소(`planner.json`)에 저장돼요. 인터넷이나 와이파이와는 상관없어요.

## 빌드

`main` 브랜치에 push하면 GitHub Actions(`.github/workflows/android.yml`)가 APK를 빌드해 Release로 올려요.
서명 키(`android/planner.jks`)는 개인 설치용이며, 같은 키로 서명해야 업데이트 설치가 돼요.

개발용 실행: `npm install` → `npm run dev` (브라우저) 또는 `npx tauri dev`.
