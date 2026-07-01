# 실기기 · 원격 테스트 가이드

이 프로젝트는 **Expo SDK 57**이라 스토어 Expo Go로는 실기기 실행이 안 된다("Project is incompatible with this version of Expo Go"). 실기기는 **dev 빌드(dev client)** 로만 가능하다. 아래는 상황별 실행법.

## 상황별 요약

| 원하는 것 | 방법 |
|---|---|
| 책상에서 빠른 UI 확인 | 웹 프리뷰 (`npm run web`) — 가장 빠름 |
| 같은 Wi-Fi에서 실기기 | dev 빌드 + `npm start` (LAN) |
| 돌아다니며 + 코드 라이브 반영 | dev 빌드 + **터널** (아래 §3) |
| 완전 독립(맥 꺼도 됨, 라이브 반영 X) | **Release 빌드** (아래 §4) |

> `Alert` 등 네이티브 UI는 웹 프리뷰에서 안 보인다 → 실기기/시뮬레이터로 확인.

## 1. dev 빌드 설치 (최초 1회)

```bash
npx expo run:ios --device <UDID>
```

연결된 기기 UDID 확인: `xcrun xctrace list devices`.

### 서명 (실기기 필수)
1. **Xcode → Settings → Accounts** 에 Apple ID 로그인. (키체인 인증서만으론 부족 — 로그인 안 되어 있으면 `error: No Account for Team "<team>"`)
2. `ios/Logit.xcodeproj/project.pbxproj` 앱 타겟 Debug/Release 설정에 주입:
   ```
   CODE_SIGN_STYLE = Automatic;
   DEVELOPMENT_TEAM = <team-id>;
   ```
   - 개인 Apple ID 팀(무료): 기기 자동 등록되어 수월하나 **앱이 7일 후 만료** → 재설치 필요.
   - 조직 유료 계정: 1년.
3. 프로파일 최초 생성이 실패하면 1회 직접 생성 후 재시도:
   ```bash
   xcodebuild -workspace ios/Logit.xcworkspace -scheme Logit \
     -configuration Debug -destination "id=<UDID>" -allowProvisioningUpdates
   ```

> ⚠️ `ios/`는 `.gitignore`(CNG로 prebuild 재생성). **`expo prebuild` 재실행/새 클론 시 위 서명 주입이 날아가** 서명 이슈가 재발한다. 그때 pbxproj에 다시 주입할 것.

## 2. 같은 Wi-Fi (LAN)

```bash
npm start        # 또는 npx expo start
```
dev 앱을 열면 같은 네트워크의 Metro를 자동으로 찾아 붙는다. 폰·맥이 **같은 Wi-Fi**여야 하고, 기기격리(회사/카페 Wi-Fi) 있으면 실패 → §3 또는 격리 없는 망 사용.

## 3. 원격 / 돌아다니며 + 라이브 반영 (터널)

```bash
npx expo start --dev-client --tunnel
```
- 인터넷 경유(ngrok `*.exp.direct`)라 **셀룰러(5G)로도** 붙고, 코드 저장 시 **Fast Refresh 라이브 반영**된다.
- 조건: 맥이 켜져 있고 이 Metro가 계속 실행. 맥 슬립/종료 시 끊김.

### 접속 방법 — **https 수동 입력만 확실**
1. dev 앱 열기 → **"Enter URL manually"**
2. 터널 URL 입력 후 Connect:
   ```
   https://<sub>.exp.direct
   ```
- 터널 URL이 비대화형 출력엔 안 찍히면: `curl -s http://localhost:4040/api/tunnels`
- **`exp://` 및 커스텀스킴 딥링크(`com.anonymous.Logit://expo-development-client/?url=...`)는 URL 전달이 안 돼 "No script URL provided (null)" 로 뜬다. 쓰지 말 것.**
- 터널 URL은 **Metro 재시작마다 바뀐다**.
- 사무실 등 **ngrok 차단망에선 터널 자체가 실패**("ngrok tunnel took too long") → 격리 없는 망 또는 폰 핫스팟(맥을 핫스팟에 연결) 사용.

## 4. 완전 독립 실행 (Release)

맥·서버·Wi-Fi 전부 불필요. JS가 앱에 내장되어 아이콘 탭만으로 실행. **라이브 반영은 없음.**

```bash
npx expo run:ios --device <UDID> --configuration Release
```
- 설치 시점엔 기기가 맥에 연결돼 있어야 하고, 설치 후엔 뽑고 자유롭게 사용.
- 개인 서명이면 마찬가지로 7일 만료.

## 트러블슈팅

| 증상 | 원인 / 해결 |
|---|---|
| "incompatible with this version of Expo Go" | Expo Go로 실기기 실행 시도. → dev 빌드 사용 |
| "No script URL provided (null)" | dev 앱에 Metro URL 미전달. → "Enter URL manually"에 https 수동 입력 |
| "No Account for Team" | Xcode Accounts에 Apple ID 미로그인 |
| "ngrok tunnel took too long" | 네트워크가 ngrok 차단. → 다른 망/핫스팟 |
| LAN에서 연결만 하다 실패 | Wi-Fi 기기격리. → 터널 또는 핫스팟 |
