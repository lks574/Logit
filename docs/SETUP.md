# 초기 세팅 가이드

새 머신에서 Logit을 처음 받아 실행하는 방법. 실기기/원격 상세는 `docs/DEVICE_TESTING.md`, 현재 진행상황은 `docs/PROGRESS.md` 참조.

## 사전 준비

| 도구 | 용도 | 비고 |
|---|---|---|
| **Node.js** (18+ / LTS 권장) | JS 런타임 | `node -v` |
| **npm** | 패키지 매니저 | Node에 포함 |
| **Xcode** | iOS 시뮬레이터·실기기 빌드 | Mac + iOS 개발 시. App Store 설치 후 1회 실행해 라이선스 동의 |
| **Watchman** (선택) | 파일 감시 성능 | `brew install watchman` |

- **웹 프리뷰만** 쓸 거면 Node/npm만 있으면 된다(Xcode 불필요).
- 이 프로젝트는 **Expo SDK 57**. 스토어 Expo Go로는 실기기 실행 불가 → 실기기는 dev 빌드 필요(`docs/DEVICE_TESTING.md`).

## 받기 & 설치

```bash
git clone https://github.com/lks574/Logit.git
cd Logit
npm install
```

> `node_modules/`, `ios/`, `android/`는 `.gitignore`라 clone에 없다(정상). `npm install` + 아래 실행 시 자동 복원(네이티브는 prebuild로 재생성).

### Firebase config

`src/lib/firebaseConfig.ts`에 웹 config가 들어있다(레포에 커밋됨). 웹 `apiKey`는 비밀이 아니라(앱 번들에 어차피 포함, 보안은 Security Rules·API 키 제한·App Check로) 편의상 커밋해 둔다.
- 값이 채워져 있으면 실제 Firebase Auth 사용(`isFirebaseConfigured`), placeholder면 로컬 mock 인증으로 폴백.
- ⚠️ **서비스 계정 JSON·GoogleService-Info.plist는 절대 커밋 금지**(이건 진짜 비밀).

## 실행

```bash
npm run web        # 브라우저 프리뷰(react-native-web) — 가장 빠른 확인 루프
npm start          # Metro. 시뮬레이터는 터미널에서 i(iOS)/a(Android)
npm run ios        # 네이티브 dev 빌드(expo run:ios) → 시뮬레이터/실기기
npm run android    # 안드로이드 dev 빌드
```

- 대부분의 UI/로직 확인은 **웹 프리뷰**가 가장 빠르다.
- `npm run ios`/`android` 최초 실행 시 `ios/`·`android/`가 없으면 자동으로 **prebuild(CNG)** 되어 생성된다.

## iOS 실기기 (요약)

1. `npm run ios` 또는 `npx expo run:ios --device <UDID>` (연결기기 UDID: `xcrun xctrace list devices`)
2. **서명**: Xcode → Settings → Accounts에 Apple ID 로그인 필요. `ios/Logit.xcodeproj/project.pbxproj` 앱 타겟에 `CODE_SIGN_STYLE=Automatic; DEVELOPMENT_TEAM=<team>` 주입.
   - `ios/`가 gitignore라 **prebuild 재생성 시 서명 주입이 날아간다** → 다시 넣을 것.
3. 돌아다니며 라이브 반영은 터널: `npx expo start --dev-client --tunnel` → dev 앱에서 `https://<sub>.exp.direct` 수동 입력.

자세한 서명·터널·트러블슈팅은 **`docs/DEVICE_TESTING.md`**.

## 데이터

- 전부 기기 로컬(AsyncStorage, 키 `logit.store.v1`). 서버 없음.
- 앱 삭제 시 데이터 초기화. dev 빌드(개인서명)는 7일 만료 → 재설치 시 리셋.

## 문서 맵

| 문서 | 내용 |
|---|---|
| `docs/PROGRESS.md` | 진행상황·완료/미완·재개 포인터 |
| `docs/SETUP.md` | (이 문서) 초기 세팅·실행 |
| `docs/DEVICE_TESTING.md` | 실기기·원격 테스트 상세 |
| `docs/FOUNDATION.md` | 디자인 토큰·공용 컴포넌트·네비 계약 |
| `docs/DATA_MODEL.md` | 엔티티·유연 스키마·영속·마이그레이션 |
| `docs/STORE.md` | 스토어 사용 계약(액션/셀렉터) |
