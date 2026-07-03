# EAS

**한 줄 정의**: Expo Application Services. Expo가 운영하는 클라우드 서비스 묶음으로, 핵심은 **Build**(클라우드 네이티브 빌드), **Submit**(스토어 자동 제출), **Update**([[OTA Update]] 배포)의 세 축이다.

**iOS/AOS로 치면**: Xcode Cloud + fastlane(gym/deliver) + App Store Connect 업로드 파이프라인을 하나의 호스팅 서비스로 묶은 것. CI에서 아카이브 만들고 서명하고 TestFlight/스토어에 올리던 그 파이프라인의 관리형(managed) 버전.

## 설명

**EAS Build** — 클라우드에서 iOS/Android 바이너리를 빌드한다. `eas build` 명령이 프로젝트를 업로드하면, 클라우드의 macOS/Linux 빌더가 [[Prebuild]](네이티브 프로젝트가 없는 [[CNG]] 프로젝트의 경우) → 의존성 설치 → Xcode/Gradle 빌드를 수행하고 .ipa/.aab를 산출한다.

- 네이티브 개발자에게 가장 반가운 부분은 **서명 관리 대행** — 인증서·프로비저닝 프로파일 생성과 갱신을 EAS가 처리해 줄 수 있어, 팀원 전원이 인증서 지옥을 겪을 필요가 없다.
- 빌드 설정은 `eas.json`에 프로파일(예: development/preview/production)로 선언하며, development 프로파일이 [[Dev Client]]를 만드는 데 쓰인다.
- Windows/Linux 사용자가 iOS 빌드를 만들 수 있는 것도 클라우드 빌드 덕이다.

**EAS Submit** — 빌드된 바이너리를 App Store Connect / Google Play Console에 자동 제출한다. fastlane deliver/supply에 해당하는 역할. Build와 이어 붙이면 "명령 한 번 → 빌드 → TestFlight 업로드"까지 자동화된다.

**EAS Update** — 스토어 심사 없이 JS [[Bundle]]과 에셋만 교체하는 [[OTA Update]] 서비스. 채널/브랜치 개념으로 어떤 빌드 집단에 어떤 업데이트를 내보낼지 제어한다.

네이티브 코드는 못 바꾼다는 본질적 한계는 [[OTA Update]] 노트 참고.

이 셋이 맞물리는 전형적 워크플로우: 개발자는 EAS Build로 [[Dev Client]]와 프로덕션 빌드를 만들고 → Submit으로 스토어에 올리고 → 출시 후 JS 수정은 Update로 즉시 배포, 네이티브 변경이 생기면 다시 Build부터.

[[CNG]]와 결합하면 로컬에 Xcode 없이도 이 사이클 전체가 돌아간다.

알아둘 현실적 사항들: EAS는 **유료 서비스**다(무료 티어 존재, 빌드 대기열·동시성 제한 등은 요금제에 따름 — 최신 조건은 공식 문서 확인). 또한 필수가 아니다 — CNG 프로젝트라도 로컬에서 prebuild 후 Xcode/Gradle로 직접 빌드하거나 자체 CI를 쓸 수 있다.

EAS는 그 과정을 대신해 주는 편의 서비스이지 Expo 사용의 전제 조건이 아니다.

## 관련
[[OTA Update]] · [[Prebuild]] · [[CNG]] · [[Dev Client]] · [[Bundle]] · [[Expo Go]]
