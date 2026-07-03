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
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios --device <UDID>
```

연결된 기기 UDID 확인: `xcrun xctrace list devices` (케이블 연결 시 `== Devices ==`에 표시).

> ⚠️ **`expo-dev-client` 필수.** 이게 없으면 `expo run:ios`가 dev 런처 없는 일반 debug 빌드를 만든다.
> 그 빌드는 URL 입력 화면(런처)이 아예 안 뜨고, 셀룰러/재실행 시 패키저를 못 찾아
> **null URL 네이티브 크래시**(`No script URL provided … (null)`, `RCTFatal`)로 죽는다. `--dev-client`/`--tunnel`도 무의미.
> `npx expo install expo-dev-client` 후 재빌드할 것. (설치 여부: `ls node_modules/expo-dev-client`)

> ⚠️ **UTF-8 로케일 필수.** 터미널 로케일이 ASCII면 `pod install`이 `Unicode Normalization not appropriate for ASCII-8BIT`로 실패하고,
> CocoaPods가 진짜 에러를 출력하려다 또 죽어 원인이 가려진다. 명령 앞에 `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`를 붙일 것.

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

> ⚠️ **bundle id / package 변경 시**: `app.json`만 고치면 반영 안 된다(`expo run:ios`의 prebuild는 기존 `ios/`를 덮어쓰지 않음). `npx expo prebuild --clean`으로 네이티브 재생성해야 iOS·Android 양쪽 반영된다. clean은 서명을 지우므로 재주입 필요, 새 bundle id엔 프로파일이 없어 첫 빌드가 "No profiles for '…' were found"로 실패 → 위 §1-3 xcodebuild `-allowProvisioningUpdates`로 프로파일 1회 생성 후 `expo run:ios` 재시도. **bundle id를 바꾸면 iOS가 다른 앱으로 취급해 기존 저장 데이터는 새 앱에 넘어오지 않는다.**

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

> **`scheme` 필수.** `app.json`의 `expo.scheme`(예: `"logit"`)이 없으면 Metro가
> `Could not find a shared URI scheme for the dev client` 경고를 내고, dev 앱이 URL을 못 받아
> **null URL로 네이티브 크래시**(`RCTFatal` → `handleBundleLoadingError`, `unsanitizedScriptURLString = (null)`)한다.
> 런처 UI조차 안 뜨고 흔들기(dev 메뉴)도 안 먹는다. `scheme` 추가 후 **재빌드**(`expo run:ios`, prebuild가 서명 주입을 지우니 §1 재주입)해야 반영된다.

### 접속 방법 — QR 스캔 (scheme 설정 후) 또는 https 수동 입력
- **QR**: `scheme`이 있으면 터미널 QR을 카메라로 스캔 → dev 앱이 URL 물고 바로 열림. 딥링크 직접: `logit://expo-development-client/?url=<터널URL>`
- **수동 입력**: dev 앱 → **"Enter URL manually"** → `https://<sub>.exp.direct` Connect
- 터널 URL이 비대화형 출력엔 안 찍히면: `curl -s http://localhost:4040/api/tunnels`
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
| "No script URL provided (null)" + 런처 안 뜸/크래시 | `expo-dev-client` 미설치(§1). → `expo install expo-dev-client` 후 재빌드 |
| "No script URL provided (null)" (런처는 뜸) | dev 앱에 Metro URL 미전달. → "Enter URL manually"에 https 수동 입력 |
| `pod install` "Unicode Normalization … ASCII-8BIT" | 터미널 로케일 비UTF-8. → `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` 붙여 실행 |
| "No Account for Team" | Xcode Accounts에 Apple ID 미로그인 |
| "ngrok tunnel took too long" | 네트워크가 ngrok 차단. → 다른 망/핫스팟 |
| "remote gone away" / "failed to start tunnel" | ngrok 일시 오류. → 기존 ngrok/expo 프로세스 정리 후 재시도 |
| LAN에서 연결만 하다 실패 | Wi-Fi 기기격리. → 터널 또는 핫스팟 |

## 용어 정리

**Expo Go** — 앱스토어의 범용 Expo 실행 앱. 네이티브 모듈을 못 바꿔서 SDK 57 커스텀 빌드는 못 연다. → 이 프로젝트는 dev 빌드 필수.

**dev 빌드 (dev client)** — 우리 앱을 직접 빌드한 개발용 앱. 안에 개발용 런처가 들어 있어 Metro 서버 주소를 물려주면 그 JS를 받아 실행한다. `expo run:ios`로 만든다.

**Metro (번들러)** — 맥에서 도는 개발 서버. TS/JS를 하나의 JS 번들로 묶어 `localhost:8081`로 서빙하고, 파일 저장 시 바뀐 부분만 다시 밀어준다(Fast Refresh). dev 앱/웹은 이걸 물어야 화면이 뜬다.

**localhost / `127.0.0.1`** — "이 기기 자신". 맥에서 `localhost:8081`은 맥의 Metro지만, 폰에서 같은 주소를 열면 폰 자신을 가리켜 실패한다. → 폰에서 보려면 LAN IP나 터널 주소가 필요.

**LAN** — 같은 Wi-Fi(공유기) 안에서 서로의 사설 IP로 직접 통신. 빠르지만 폰·맥이 같은 망이어야 하고, 회사/카페의 "기기격리(client isolation)"가 켜져 있으면 서로 못 본다.

**터널 (tunnel)** — 맥의 로컬 서버를 인터넷에 공개하는 우회로. 같은 Wi-Fi가 아니어도(셀룰러 포함) 붙는다. Expo는 ngrok으로 구현.

**ngrok** — 로컬 서버를 인터넷에 잠깐 노출시켜주는 독립 터널링 서비스(expo와 무관, `ngrok.com`). 내 맥에서 **밖으로 나가는** 연결을 ngrok 서버에 뚫고, 공개 URL을 발급받아 그리로 온 요청을 내 맥으로 되돌려 배달한다. 밖으로 뚫기 때문에 공유기 포트포워딩·NAT 설정 없이도 노출된다. `expo start --tunnel`이 이걸 자동 실행하고 전용 도메인 `*.exp.direct`로 URL을 준다.
- URL 구조 예 `wvkp2ue-anonymous-8081.exp.direct` = `랜덤서브도메인-계정라벨-로컬포트.exp.direct`
- 익명/무료라 URL은 **세션마다 바뀌고** 끊기기 쉽다. 로컬 대시보드 `http://localhost:4040`(`/api/tunnels`)에서 현재 URL 확인 가능.
- 공개 주소이므로 민감 서버를 오래 열어두지 말 것. 회사망이 ngrok을 차단하면 터널 자체가 안 뚫린다.

**Fast Refresh / HMR** — 코드 저장 시 앱을 껐다 켜지 않고 바뀐 부분만 갈아끼워 화면에 즉시 반영하는 것. dev 빌드·웹에서 동작(Release 빌드는 JS가 내장돼 반영 안 됨).

**scheme (URI 스킴)** — 앱을 여는 커스텀 URL 접두사(예 `logit://`). dev 앱에 Metro 주소를 딥링크/QR로 넘길 때 필요. `app.json`의 `expo.scheme`. 없으면 §3 경고처럼 URL 전달이 깨진다.

**prebuild / CNG (Continuous Native Generation)** — `app.json` 설정으로부터 `ios/`·`android/` 네이티브 프로젝트를 자동 생성하는 것. 이 레포는 `ios/`를 커밋하지 않고(`.gitignore`) 필요 시 재생성한다. 그래서 prebuild가 돌면 pbxproj에 손으로 넣은 코드서명 설정이 날아가 §1 재주입이 필요.

**UDID** — 개별 기기의 고유 식별자. 실기기에 빌드/설치할 때 `--device <UDID>`로 대상 지정. `xcrun xctrace list devices`로 확인(케이블 연결 시 `== Devices ==`에 표시).
