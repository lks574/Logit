# Logit 웹 배포 — Vercel Hobby

Logit의 Expo/React Native Web 정적 빌드를 Vercel에 배포하는 절차다.

## 전제

- Expo SDK 57의 최소 Node.js는 22.13.x다.
- 이 프로젝트는 Vercel 빌드 환경을 Node.js 24.x로 고정한다.
- Vercel Hobby는 개인·비상업 프로젝트에만 사용할 수 있다.

## 로컬 검증

```bash
npm install
npm run build:web
npm run serve:web
```

프로덕션 산출물은 `dist/`에 생성되며 Git에는 포함하지 않는다.

## 최초 배포

```bash
npx vercel@latest
```

CLI 질문에서 기존 프로젝트가 없다면 새 프로젝트를 만들고, 프로젝트 이름은 `logit` 또는 사용 가능한 이름을 선택한다. `vercel.json`이 빌드 명령과 출력 디렉터리를 지정하므로 Framework Preset을 별도로 고를 필요가 없다.

프로덕션 반영:

```bash
npx vercel@latest --prod
```

`.vercelignore`는 `node_modules`, 네이티브 빌드 폴더, 로컬 문서와 서명·Firebase 네이티브 설정 파일을 업로드에서 제외한다. Vercel은 `package-lock.json`으로 의존성을 다시 설치한다.

현재 프로덕션 주소: <https://logit-opal.vercel.app>

Git 저장소를 Vercel 프로젝트에 연결하면 이후 push마다 Preview Deployment가, production branch push마다 Production Deployment가 생성된다.

## Firebase 설정

배포 후 Firebase Console의 **Authentication → Settings → Authorized domains**에 실제 Vercel 프로덕션 도메인을 추가한다. Preview URL은 매번 달라질 수 있으므로 인증 검증에는 고정된 프로덕션 도메인이나 연결한 사용자 도메인을 사용한다.

웹에서는 이메일/비밀번호, Google popup 로그인, 게스트 모드를 지원한다. Firebase Console에서 Google 제공업체를 활성화하고 프로덕션 도메인을 Authorized domains에 등록해야 한다.

## SPA 라우팅

Logit은 React Navigation 기반 SPA다. `vercel.json`의 rewrite가 `/record/...`, `/stats` 같은 직접 접근과 새로고침을 `index.html`로 연결한다.

## 데이터 특성

- 로컬 기록은 브라우저의 저장소에 저장되므로 브라우저나 기기를 바꾸면 자동으로 따라오지 않는다.
- 새 기기/브라우저에서 로그인할 때 로컬 콘텐츠가 비어 있으면 해당 계정의 마지막 클라우드 백업을 1회 자동 복원한다.
- 이미 로컬 콘텐츠가 있으면 덮어쓰지 않으며, 이 경우 `마이 → 클라우드 백업 → 복원`을 사용한다.
- 웹에서는 네이티브 알림, 모바일 광고, 공유 카드 캡처 등 일부 기기 전용 기능이 제한될 수 있다.
