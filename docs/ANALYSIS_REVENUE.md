# Logit 수익화 · 클라우드 사진 저장 분석

> 기준일: 2026-07-22. 가격은 지역·세금·환율에 따라 달라질 수 있으며, 아래 계산은 USD 정가와 `1 USD = 1,400원` 가정이다. 구현 검토 전 프로젝트 지침에 따라 [Expo SDK 57 버전 문서](https://docs.expo.dev/versions/v57.0.0/)를 확인했다.

## 결론

- 수익화는 **무료 핵심 기록 경험 + 단일 Plus 구독**으로 시작한다. 기록 생성·수정·전체 타임라인은 무료로 유지하고, 지속 원가/고급 가치가 있는 클라우드 사진, 자동 백업, 고급·전체기간 통계, 테마, 광고 제거를 Plus에 묶는다.
- 광고는 입력 흐름이 아니라 소비 흐름에 둔다. 홈의 최근 기록 뒤에 네이티브 광고를 제한적으로 섞고, 보상형 광고는 사용자가 명시적으로 데이터 기능을 실행할 때만 쓴다. 같은 세션에서 반복 시청을 요구하지 않도록 30분 패스를 둔다.
- 사진 저장은 **1차 Firebase Storage**, 규모·egress 확인 후 **R2 재평가**를 권장한다. R2가 계산상 가장 싸지만 Firebase는 현재 Auth/Firestore와 보안·운영이 일체화되어 MVP 출시 속도와 사고 위험 측면에서 유리하다.

---

# A. 수익화

## A-1. 외부 앱 모델

| 앱 | 무료/유료 경계 | Logit에 주는 시사점 |
|---|---|---|
| Day One | 2026년 3월 기존 Premium이 Silver로 개명. Basic은 핵심 저널, Silver는 연 $49.99에 기기간 동기화, 엔트리당 최대 30개 미디어, 통합·색상/아이콘 등을 제공하고 Gold는 AI를 추가한다. [공식 FAQ](https://dayoneapp.com/guides/premium-subscription/day-one-premium-faq/) | 기록 자체보다 **미디어·동기화·꾸미기·고급 기능**을 과금한다. Logit의 사진 백업을 구독 핵심 가치로 삼을 근거가 강하다. |
| Strava | 기록/커뮤니티의 기본 루프는 무료, 구독은 경로, 세그먼트 리더보드, 고급 훈련 분석 등을 연다. 가격은 국가별로 다르다. [공식 구독 안내](https://www.strava.com/subscribe?cta=premium&element=nav&source=global-header), [지역 가격 FAQ](https://support.strava.com/en-us/articles/15401674-subscription-pricing-faq) | 입력·기록 소유권은 무료로 두고 **해석과 고급 분석**을 과금한다. |
| Hevy | 무료는 루틴 4개, 커스텀 운동 7개, 그래프 3개월 등의 한도가 있고 Pro는 루틴·커스텀 운동·그래프 히스토리·신체 측정을 무제한화한다. 월/연/평생 상품을 제공한다. [공식 가격/기능](https://hevy.com/pricing) | 제한은 기록 건수보다 **설정 가능한 도구와 분석 기간**에 두는 편이 반복 기록 습관을 덜 훼손한다. |
| 왓챠피디아 | 현재 App Store에는 기록·취향 아카이브가 무료 앱으로 제시되고 별도 IAP가 표시되지 않는다. 자체 광고 상품은 앱/웹 피드형 지면을 판매한다. [App Store](https://apps.apple.com/kr/app/%EC%99%93%EC%B1%A0%ED%94%BC%EB%94%94%EC%95%84/id644185507), [광고 상품 소개서](https://an2-ast.amz.wtchn.net/Watchapedia_AD_202310.pdf) | 아카이브/발견 피드에서는 **콘텐츠 문맥의 네이티브 광고**가 자연스럽다. 다만 Logit처럼 개인 데이터 비중이 높은 앱은 광고 밀도를 더 낮춰야 한다. |

가격은 그대로 복제할 대상이 아니라 가치 경계의 참고치다. 특히 Day One과 Strava의 해외 가격은 국내 초기 개인 기록 앱의 지불의사보다 높을 수 있다.

## A-2. Logit 현재 상태

- 핵심 기록·통계·내보내기·Firestore JSON 백업이 구현되어 있다.
- 보상형 광고는 JSON/CSV 내보내기, 가져오기 확정, 클라우드 백업 앞에 있다.
- `NativeAdCard`는 구현되어 있었지만 실제 화면에는 배치되지 않았다.
- 구독/IAP와 서버 검증된 entitlement는 없다.
- JSON 백업에 사진 로컬 URI만 들어가므로 기기 이전/재설치 때 사진이 깨진다.

현재의 가장 큰 수익화 문제는 광고 포맷 부족이 아니라 **가치 교환이 반복적이고 불명확한 것**이다. 한 번 백업하고 곧바로 내보내면 광고를 다시 보게 되며, 반대로 만들어 둔 네이티브 광고는 노출되지 않았다.

## A-3. 광고 개선안

### 배치 원칙

1. 기록 입력, 저장 직전, 삭제 확인, 로그인/권한 요청에는 광고를 넣지 않는다.
2. 홈·통계처럼 사용자가 이미 가치를 받은 소비 화면의 유기적 콘텐츠 뒤에 네이티브 광고를 둔다.
3. 보상형은 사용자가 버튼을 눌러 시작한 명확한 가치 교환에만 사용한다. Google도 광고 배치 실험을 허용하지만 무효 클릭·노출 유도는 금지한다. [AdMob 행동 정책](https://support.google.com/admob/answer/2753860?hl=en)
4. 빈 상태와 첫 기록 전에는 광고를 보이지 않는다. 첫 성공 경험을 먼저 만든다.
5. 프리미엄은 모든 광고를 제거한다. 광고 제거만이 아니라 사진·분석 가치와 함께 묶는다.

### 권장 지면·빈도

| 지면 | 포맷/빈도 | 이유 |
|---|---|---|
| 홈 최근 기록 뒤 | 네이티브 1개, 기록 3개 이상일 때 | 핵심 카드와 시각 언어가 맞고 스크롤 말단이라 방해가 작다. **이번 quick-win으로 구현.** |
| 통계 화면 | 후속 A/B 후보: 전체 통계 말단 네이티브 1개, 세션당 최대 1회 | 분석을 먼저 보여 준 뒤 노출. 초기에는 홈과 동시 노출하지 말고 Remote Config로 실험한다. |
| 데이터 내보내기·무료 클라우드 백업 | 보상형, 성공 시 30분 동안 관련 기능 패스 | 명시적 가치 교환을 유지하면서 연속 작업의 피로를 줄인다. **이번 quick-win으로 구현.** |
| 가져오기/복원 | 광고 제거 권장 | 사용자가 자기 데이터에 다시 접근하는 복구 경로이므로 실패·이탈 비용이 광고 수익보다 크다. 현재 공유 확정 로직을 분리한 뒤 제거한다. |
| 기록 폼/상세의 주요 CTA 주변 | 배치 금지 | 오탭 위험과 기록 완료율 저하가 크다. |

추가 계측 없이 광고 밀도를 올리지 않는다. 최소 지표는 `home_ad_impression`, `reward_offer`, `reward_earned`, `data_action_complete`, 광고 전후 이탈률이다. 프로젝트에서 PostHog를 제외했으므로 Firebase Analytics 등을 새로 도입하기 전에는 AdMob 집계와 직접 QA로만 판단한다.

## A-4. 구독 티어 제안

초기에는 복잡한 다단계 대신 한 상품만 검증한다.

| | Free | Logit Plus |
|---|---|---|
| 권장 가격 | 무료 | **월 3,900원 / 연 29,000원**(월 환산 2,417원, 약 38% 할인), 14일 체험 후보 |
| 기록 생성·수정·삭제 | 무제한 | 무제한 |
| 타임라인/캘린더 | 전체 기간 | 전체 기간 |
| 통계 | 최근 3개월 기본 통계 | 전체 기간 + 활동별 추세·비교·연간 회고 |
| JSON/CSV 로컬 내보내기·가져오기 | 유지. 내보내기는 30분 보상형 패스, 가져오기는 광고 제거 권장 | 무광고 |
| 클라우드 JSON 백업 | 수동, 보상형 | 자동·무광고·멀티기기 |
| 클라우드 사진 | 로컬 전용 | 자동 사진 백업/복원, 초기 공정사용 한도 5GB |
| 테마 | light/dark/system | 추가 팔레트·아이콘 |
| 광고 | 저빈도 네이티브 + 선택형 보상 | 제거 |

### 게이팅 근거

- **기록 건수나 전체 타임라인을 막지 않는다.** Logit의 핵심 경쟁력인 이종 활동 타임라인과 습관 루프를 훼손하기 때문이다.
- **클라우드 사진**은 지속 원가와 재설치/기기이전이라는 명확한 문제를 함께 해결하므로 가장 설득력 있는 구독 앵커다.
- **전체기간·고급 통계**는 Strava/Hevy가 검증한 과금 경계다. 원본 기록은 남아 있고 해석 기능만 확장되므로 신뢰 손상이 작다.
- **광고 제거·테마**는 단독 구매 동기보다 묶음 보강재다.
- 평생 Plus는 사진 저장 원가가 영구 발생하므로 권장하지 않는다. 평생 상품을 시험한다면 클라우드 사진을 제외한 `Logit Classic`으로 별도 정의해야 한다.

### IAP 구현 단계

1. 상품 ID 예: `logit_plus_monthly`, `logit_plus_annual`; entitlement는 `plus` 하나로 통합한다.
2. RevenueCat 또는 자체 StoreKit 2/Google Play Billing + 서버 검증 중 하나를 선택한다. 클라이언트 로컬 boolean만으로 사진 저장 권한을 결정하지 않는다.
3. Firestore `entitlements/{uid}` 또는 커스텀 클레임에 `active`, `expiresAt`, `source`, `productId`를 저장하고 Storage 규칙/서명 URL 서버가 검증한다.
4. 구매 복원, 유예기간, 환불/취소, 만료 오프라인 캐시를 설계한다.
5. Remote Config는 가격/권한의 진실 원장이 아니라 paywall 노출·카피·실험 플래그에만 사용한다.

앱 내 디지털 기능과 클라우드 서비스를 판매하므로 iOS에서는 IAP가, Play 배포에서는 원칙적으로 Play Billing이 필요하다. [Apple App Review Guidelines 3.1](https://developer.apple.com/app-store/review/guidelines/), [Google Play Payments 정책](https://support.google.com/googleplay/android-developer/answer/10281818?hl=en). 지역별 대체결제 예외는 출시 시점 정책을 다시 확인한다.

---

# B. 사진 저장

## B-1. 제안 아키텍처

### 데이터 흐름

1. 선택 시 현재처럼 `expo-image-picker quality: 0.7` 후 `document/photos`에 로컬 영구 사본을 둔다.
2. 백업 큐가 로컬 파일의 해시와 크기를 계산하고 `users/{uid}/photos/{sha256}.jpg`에 업로드한다. 해시 키로 중복 사진을 재업로드하지 않는다.
3. Firestore 백업 envelope에는 로컬 URI 대신/와 함께 `{ photoId, objectPath, byteSize, contentType, checksum }` manifest를 저장한다. 구버전 문자열 URI도 계속 읽는 additive migration으로 간다.
4. 복원은 JSON을 먼저 검증하고 사진을 임시 디렉터리에 내려받은 뒤 checksum 확인 → `document/photos`로 이동 → store 교체 순으로 수행한다. 일부 실패 시 레코드와 실패 목록을 보여 주고 재시도한다.
5. 레코드에서 사진을 제거할 때 즉시 원격 삭제하지 않고 7~30일 tombstone을 둔다. 다른 레코드가 같은 hash를 참조하는지 확인 후 lifecycle/서버 작업으로 삭제한다.
6. 업로드는 Wi-Fi 전용 옵션, 앱 foreground 재시도, 동시성 2~3, 지수 backoff를 적용한다. 원본이 아니라 현재 압축본만 백업해 비용과 개인정보 노출을 줄인다.

### 보안

- Firebase Storage: `request.auth.uid == uid`, 허용 content-type은 image, 객체 크기 상한(예: 5MB), 사용자 quota를 규칙/서버에서 검증한다.
- R2/S3: 앱에 access key를 넣지 않는다. Firebase ID token을 검증하는 Worker/API가 짧은 만료의 presigned PUT/GET URL을 발급한다.
- 다운로드 URL을 영구 공개 URL로 저장하지 않고 object path를 저장한다.
- 계정 삭제는 Firestore JSON뿐 아니라 사용자 prefix의 사진과 업로드 세션도 삭제한다.
- 개인정보처리방침에 보관 위치, 보관 기간, 삭제, 하위처리자, 국외 이전을 반영한다.

## B-2. 프로바이더 단가 비교

아래는 비교 가능한 hot/standard storage 기준이다. Firebase는 현재 프로젝트의 `*.firebasestorage.app` 버킷과 북미 single-region GCS 단가를 가정했다. 실제 Firebase 버킷 location이 다르면 재계산해야 한다.

| 프로바이더 | 저장 | 인터넷 전송(egress) | 요청 | 무료/기본 포함 | 운영 특성 |
|---|---:|---:|---:|---|---|
| Firebase Storage / GCS | 약 $0.020/GB-month(single-region) | 계산은 $0.12/GB 사용 | Class A $0.005/1k, Class B $0.0004/1k | Firebase 신규 버킷: 5GB-month, 다운로드 100GB/month, 업로드 5k, 다운로드 50k. 무료 범위/location 조건 확인 필요 | 기존 Firebase Auth와 규칙 결합이 가장 단순. [Firebase 가격](https://firebase.google.com/pricing), [GCS 가격](https://cloud.google.com/storage/pricing) |
| Cloudflare R2 Standard | $0.015/GB-month | **직접 R2 egress 무료** | Class A $4.50/M, Class B $0.36/M | 10GB, A 1M, B 10M/month | 가장 낮고 예측 가능한 전송비. 별도 Worker/Auth·presigned URL 계층 필요. [R2 공식 가격](https://developers.cloudflare.com/r2/pricing/) |
| AWS S3 Standard | $0.023/GB-month(미 동부 baseline) | 계산은 첫 100GB 무료 후 $0.09/GB 사용 | PUT $0.005/1k, GET $0.0004/1k | 계정/서비스 합산 무료 전송 조건은 출시 시 확인 | 성숙한 도구·lifecycle, 그러나 IAM/서명 서버와 비용 항목이 복잡. [S3 공식 가격](https://aws.amazon.com/s3/pricing/) |
| Supabase Storage Pro | 기본 $25/month | 250GB cached 포함, 초과 $0.03/GB(uncached $0.09) | API 요청 별도 과금 없음 | 100GB storage, cached/uncached egress 각 250GB | 빠른 DX지만 Firebase와 Auth/DB가 이원화되고 소규모에는 $25 floor. [공식 가격](https://supabase.com/pricing), [egress 문서](https://supabase.com/docs/guides/platform/manage-your-usage/egress) |

R2의 무료 egress는 R2 API/Workers API/`r2.dev`를 통한 직접 전송에 해당한다. 다른 과금 서비스에 연결하면 그 서비스 비용은 별도다.

## B-3. 비용 가정

활성 사용자 기준 성숙한 서비스의 한 달 run-rate를 비교한다.

- 이미지 평균: **0.6MB/장**. 현재 picker `quality: 0.7` 적용 후 일반 스마트폰 사진의 계획값이며, 출시 전 p50/p95 실측 필요.
- 신규 사진: **20장/사용자·월**.
- 보관: **24개월** → 사용자당 480장, 약 **0.288GB 저장**. 삭제율과 중복제거 절감은 반영하지 않아 보수적이다.
- 다운로드: **40회/사용자·월** → 약 **0.024GB egress**. 로컬 캐시와 드문 복원만 있다면 실제는 더 낮고, 썸네일 없이 원본을 피드마다 다시 받으면 더 높다.
- 요청: PUT 20회, GET 40회/사용자·월. LIST, 실패 재시도, 메타데이터 요청은 제외.
- Firebase는 북미 single-region과 해당 무료량, AWS는 성숙 계정의 저장 free tier 제외 및 월 100GB 무료 egress, R2는 월 무료량, Supabase는 Pro $25 기본료와 cached egress를 적용했다.
- 세금, 환율 변동, CDN/Worker/Functions/로그/이미지 변환, Firestore 비용, 결제 수수료는 제외했다.

## B-4. 규모별 월 예상금액

| 활성 사용자 | Firebase Storage | Cloudflare R2 | AWS S3 | Supabase Storage Pro |
|---:|---:|---:|---:|---:|
| 1,000 | **$5.74** (약 8,000원) | **$4.17** (약 5,800원) | **$6.74** (약 9,400원) | **$29.00** (약 40,600원) |
| 10,000 | **$75.42** (약 105,600원) | **$43.05** (약 60,300원) | **$80.00** (약 112,000원) | **$84.21** (약 117,900원) |
| 100,000 | **$863.46** (약 1,208,800원) | **$436.35** (약 610,900원) | **$881.00** (약 1,233,400원) | **$700.81** (약 981,100원) |

### 사용자당 월 원가

| 규모 | Firebase | R2 | S3 | Supabase |
|---:|---:|---:|---:|---:|
| 1k | $0.0057 / 약 8.0원 | $0.0042 / 약 5.8원 | $0.0067 / 약 9.4원 | $0.0290 / 약 40.6원 |
| 10k | $0.0075 / 약 10.6원 | $0.0043 / 약 6.0원 | $0.0080 / 약 11.2원 | $0.0084 / 약 11.8원 |
| 100k | $0.0086 / 약 12.1원 | $0.0044 / 약 6.1원 | $0.0088 / 약 12.3원 | $0.0070 / 약 9.8원 |

계산 예: 10k 사용자는 저장 2,880GB, 월 egress 240GB, PUT 20만, GET 40만이다. R2는 `(2,880-10)×$0.015`이고 요청은 무료량 안이다. Firebase는 저장·egress·무료 초과 요청을 각각 더했다. 공급자별 GB/GiB 표기와 청구 반올림 때문에 실제 청구서는 소폭 다를 수 있다.

### 민감도

- 평균 이미지가 1.2MB면 저장·egress 비용은 거의 2배가 된다.
- 원본을 매 화면 재다운로드해 월 GET이 400회가 되면 R2는 여전히 egress 무료지만 B 요청 비용이 늘고, Firebase/S3/Supabase는 전송비가 주도한다.
- 5GB Plus 한도는 위 기준 약 34년분(월 20장)의 압축 사진이므로 초기에는 충분하다. 다만 동영상 추가 시 즉시 재설계해야 한다.
- 100k에서 Firebase와 R2 차이는 월 약 $427이지만, 초기 1k 차이는 월 약 $1.57뿐이다. 초기에는 마이그레이션/운영 복잡도가 단가 차이보다 크다.

## B-5. 권장안

### 1단계: Firebase Storage로 출시

- 이미 쓰는 Firebase Auth의 uid와 보안 규칙을 그대로 활용할 수 있다.
- Firestore JSON backup과 동일한 장애/계정 삭제 UX로 묶기 쉽다.
- 1k 규모에서 R2 대비 추정 차이는 월 2달러 미만이다.
- `firebase/storage` 모듈을 지연 import하는 별도 `photoBackup.ts`를 만들고 Remote Config/entitlement가 켜진 Plus 사용자만 호출한다. 대형 업로드는 앱 시작을 막지 않는다.

### 2단계: 관측 후 R2 전환 또는 신규 사진 dual-write 검토

다음 중 하나가 충족되면 재평가한다.

- 10k+ 활성 사용자 또는 사진 egress가 1TB/month 초과
- 월 storage+egress가 구독 순매출의 10% 초과
- 다중 기기 피드로 원본 다운로드 빈도가 가정(40회/month)을 크게 초과

R2 전환 시 Firebase ID token을 검증하는 Cloudflare Worker, 단기 presigned URL, quota ledger, 삭제 큐가 선행돼야 한다. 기존 객체를 즉시 전량 이전하기보다 신규 업로드부터 R2에 쓰고 manifest가 provider를 포함하도록 한다.

---

# 구현·검증

## 구현

1. `src/screens/home/HomeScreen.tsx`
   - 기록 3개 이상일 때 홈의 최근 기록 카드 뒤에 `NativeAdCard`를 1회 배치했다.
   - 빈 상태·첫 기록 경험·입력 폼에는 광고를 추가하지 않았다.
2. `src/components/NativeAdCard.web.tsx`
   - 네이티브 전용 AdMob 모듈 때문에 웹 프리뷰가 깨지지 않도록 no-op 플랫폼 구현을 추가했다.
3. `src/lib/ads.ts`
   - 보상 획득 시 AsyncStorage에 30분 만료 패스를 저장한다.
   - 패스 동안 백업·내보내기·복원을 연달아 실행해도 광고를 다시 요구하지 않는다.
   - 광고 미완주/오류/타임아웃은 기존처럼 기능을 통과시키지 않는다.

## 검증

- Expo 코드 작성 전 SDK 57 버전 문서를 확인했다.
- `npm install`: 완료(의존성 631개 설치). npm audit는 기존 의존성 트리에 moderate 17건을 보고했으며 자동 수정은 범위 밖이라 수행하지 않았다.
- `npx tsc --noEmit`: **통과(오류 0)**.
- `git diff --check`: **통과**.
- 네이티브 광고의 실제 로드/노출과 30분 패스의 실기기 persistence는 dev build에서 후속 확인이 필요하다. 개발 빌드에서는 Google test ad unit을 사용한다.
