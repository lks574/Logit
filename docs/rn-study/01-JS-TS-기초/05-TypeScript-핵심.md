# TypeScript 핵심

> [!abstract] 한 줄 요약
> Swift/Kotlin의 명목적 타입 시스템에 익숙한 개발자가 TS의 구조적 타이핑을 어떻게 받아들여야 하며, "타입이 런타임에 없다"는 것은 무슨 뜻인가?

## 🔁 iOS/AOS 대응 개념

| TS 개념 | iOS (Swift) | Android (Kotlin) | 차이 |
|---|---|---|---|
| **구조적 타이핑** | 명목적 (protocol 채택 선언 필수) | 명목적 (interface 구현 선언 필수) | **가장 큰 사고 지점. 모양만 맞으면 통과** |
| `interface` / `type` | `protocol` / `struct` 정의 | `interface` / `data class` | TS interface는 구현 선언 없이 만족됨 |
| 유니온 `A \| B` | `enum` with associated values | `sealed class`/`sealed interface` | TS가 더 가볍고 ad-hoc |
| narrowing | `switch` + 패턴 매칭 | `when` + smart cast | smart cast와 거의 같은 경험 |
| 제네릭 `<T>` | 제네릭 | 제네릭 | 유사. 단 런타임에 소거됨 (Kotlin의 erasure와 같음) |
| `unknown` | `Any` (다운캐스트 강제) | `Any` (캐스트 강제) | 안전한 "모르는 값" |
| `any` | 대응 없음 (`unsafeBitCast`급 위험) | 대응 없음 | **타입 검사 전면 해제. 금지 수준으로 기피** |
| `never` | `Never` | `Nothing` | 동일 개념 |
| `T \| null`, `x?.y`, `x ?? d` | `T?`, `x?.y`, `x ?? d` | `T?`, `x?.y`, `x ?: d` | 문법까지 거의 동일. 단 null과 undefined 2종 |
| utility types | 대응 없음 (매크로로 일부) | 대응 없음 | 타입을 타입으로 계산하는 기능 |
| 컴파일 결과 | 바이너리 (타입 정보 일부 유지) | dex (제네릭 erasure) | **TS는 타입을 전부 지우고 JS만 남김** |

## 🧭 왜 이렇게 설계됐나

TS의 임무는 "이미 존재하는 방대한 JS 생태계에 *점진적으로* 타입을 입히는 것"이었다. JS는 duck typing의 세계라, "이 객체가 `UserLike`인가?"의 자연스러운 답은 "선언했는가"가 아니라 "**그 모양(속성들)을 갖췄는가**"다. 그래서 TS는 구조적 타이핑을 택했다.

또 하나의 설계 원칙: **TS는 JS에 런타임을 추가하지 않는다.** `tsc`는 (1) 타입을 검사하고 (2) 타입 표기를 *지워서* 순수 JS를 내놓는다. 그게 전부다. 컴파일된 결과물에는 interface도 제네릭도 존재하지 않는다. 따라서:

- 타입은 **컴파일 타임의 약속**일 뿐, 런타임 보장이 아니다. 서버가 명세와 다른 JSON을 보내면 TS는 아무것도 막지 못한다.
- 런타임 검증이 필요하면 zod 같은 스키마 검증 라이브러리의 영역이다 (스키마를 정의하면 런타임 검증 + TS 타입을 동시에 얻는 접근).
- `x is User` 같은 타입 가드도 결국 *내가 작성한 런타임 검사 코드*를 컴파일러가 믿어주는 것이다.

Swift/Kotlin에서 "컴파일이 되면 타입은 진실"이던 감각을, TS에서는 "**컴파일이 되면 코드 내부는 일관적. 단, 외부에서 들어오는 데이터는 별개**"로 조정해야 한다.

## ⚙️ 동작 원리

### 구조적 타이핑 — 정면 대비

```typescript
interface HasName { name: string }

class Dog { name = 'Rex'; bark() {} }

function greet(x: HasName) { console.log(x.name); }

greet(new Dog());              // OK! Dog는 HasName을 "구현"한 적 없지만 모양이 맞음
greet({ name: 'Kim' });        // OK! 즉석 객체 리터럴도 통과
```

Swift라면 `Dog: HasName` 채택 선언 없이는 컴파일 에러다. TS는 **선언이 아니라 모양**을 본다. 따름정리들:

- 이름이 다른 두 interface라도 구조가 같으면 상호 호환된다. `UserId`와 `PostId`가 둘 다 `string`이면 서로 바꿔 넣어도 에러가 안 난다 (명목적 구분이 필요하면 branded type 기법을 쓴다).
- "필요한 속성보다 많이 가진" 객체는 OK (width subtyping). 단, **객체 리터럴을 직접 넘길 때만** 초과 속성 검사(excess property check)가 작동해 오타를 잡아준다 — 변수에 담아 넘기면 검사가 사라진다는 비대칭이 있다.

### 타입 추론

```typescript
const n = 42;                  // n: 42 (const라 리터럴 타입으로 좁혀짐)
let m = 42;                    // m: number
const user = { name: 'Kim', age: 3 }; // { name: string; age: number }
const ids = [1, 2, 3].map(String);    // string[]
```

Swift/Kotlin 수준 이상으로 추론이 강력하다. 관행: 함수 시그니처(매개변수·public 반환 타입)는 명시, 지역 변수는 추론에 맡김.

### 유니온, 리터럴, narrowing

```typescript
type Status = 'idle' | 'loading' | 'success' | 'error'; // 문자열 리터럴 유니온 = 가벼운 enum

// discriminated union — sealed class/enum with associated values의 TS 버전
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function render<T>(s: FetchState<T>) {
  switch (s.status) {
    case 'success': return s.data;    // 이 분기 안에서 s는 success 케이스로 좁혀짐 (smart cast)
    case 'error':   return s.error.message;
    default:        return null;
  }
}
```

narrowing 도구: `typeof x === 'string'`(원시값), `'key' in obj`(속성 존재), `x instanceof Cls`(클래스), 판별 필드 비교(위 예시), 사용자 정의 타입 가드(`function isUser(x): x is User`). Kotlin smart cast와 체감이 같다 — 검사하면 그 블록 안에서 타입이 좁아진다.

전수 검사(exhaustiveness)는 `never`로 강제한다:

```typescript
function assertNever(x: never): never { throw new Error(`unhandled: ${x}`); }
// switch의 default에서 assertNever(s) — 케이스 추가 시 컴파일 에러로 알려줌
```

### unknown vs any vs never

- `unknown` — "무슨 타입인지 모름". **사용하려면 narrowing이 강제**된다. Swift에서 `Any`를 받으면 `as?`가 필요한 것과 같다. 외부 입력(JSON, catch된 에러)에 쓰는 올바른 타입.
- `any` — "타입 검사를 꺼줘". 무엇이든 대입되고 무엇으로든 대입되며 아무 멤버나 접근해도 통과. **any 하나가 흘러들면 주변까지 오염**된다. lint(`no-explicit-any`)로 막고, 어쩔 수 없을 때만 경계에서 `unknown`으로 받아 즉시 검증.
- `never` — "값이 존재할 수 없음". `Nothing`/`Never`와 동일. 모든 케이스를 소진한 뒤의 타입, 항상 throw하는 함수의 반환 타입.

### optional / nullish

- TS엔 빈 값이 **둘**이다: `null`(의도적 부재)과 `undefined`(값이 설정된 적 없음). optional 속성(`age?: number`)과 없는 배열 인덱스는 `undefined`를 낸다. 실무에선 대개 undefined 위주로 통일하고 둘 다 `x == null`(느슨한 비교, 관용구) 또는 `??`로 처리.
- `x?.y?.z` — optional chaining. Swift/Kotlin과 동일.
- `x ?? fallback` — nullish coalescing. `null`/`undefined`일 때만 fallback. **`||`와 다르다**: `0 || 10`은 10, `0 ?? 10`은 0. falsy(0, '', false)를 유효값으로 취급해야 하면 반드시 `??`.
- `strictNullChecks`(strict 모드에 포함)가 켜져 있어야 이 모든 게 의미가 있다. RN/Expo 템플릿은 기본 strict.

### interface vs type

```typescript
interface User { name: string }        // 확장에 열림 (extends, declaration merging)
type UserId = string;                   // 별칭. 유니온/교차/조건부 등 "타입 연산"이 필요하면 type만 가능
type Result = Success | Failure;        // interface로는 표현 불가
```

객체 모양은 둘 다 되고 성능·의미 차이는 거의 없다. 관행: 객체/props는 아무거나 팀 컨벤션으로 통일, 유니온·유틸리티 조합은 `type`. 논쟁에 시간 쓸 가치가 낮은 주제.

### 제네릭과 utility types

```typescript
function first<T>(arr: T[]): T | undefined { return arr[0]; }

interface Workout { id: string; title: string; date: string; memo?: string }

type WorkoutDraft   = Partial<Workout>;            // 전부 optional — 폼 임시 상태
type WorkoutSummary = Pick<Workout, 'id' | 'title'>; // 일부만 추출
type WorkoutInput   = Omit<Workout, 'id'>;         // id 빼고 — 생성 요청 바디
type WorkoutMap     = Record<string, Workout>;     // [id: string]: Workout 사전
type Frozen         = Readonly<Workout>;           // 전 속성 readonly
```

utility types는 "기존 타입에서 새 타입을 **계산**"한다. Swift/Kotlin엔 대응물이 없다(코드 생성/매크로로 흉내). 서버 모델 하나를 정의하고 화면별 파생 타입을 찍어내는 데 쓴다.

## 💻 코드 예시

런타임 보장이 없다는 것 — API 경계의 정석 처리:

```typescript
interface User { id: string; name: string }

// BAD: 컴파일은 통과하지만 서버가 name을 빼먹으면 런타임에 터진다
async function fetchUserUnsafe(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return res.json() as Promise<User>;  // 캐스트는 "믿어줘"일 뿐 검증이 아님
}

// GOOD: unknown으로 받고 런타임 검증 후에만 User로 승격
function isUser(x: unknown): x is User {
  return (
    typeof x === 'object' && x !== null &&
    'id' in x && typeof (x as { id: unknown }).id === 'string' &&
    'name' in x && typeof (x as { name: unknown }).name === 'string'
  );
}

async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  const body: unknown = await res.json();
  if (!isUser(body)) throw new Error('invalid user payload');
  return body; // 여기서부터 body: User (narrowing)
}
// 실전에서는 이 수작업 가드를 zod 스키마 (z.object({...}).parse(body)) 로 대체하는 것이 표준
```

## ⚠️ 함정 (Pitfalls)

- **구조적 타이핑발 오탐 부재.** 같은 구조의 다른 의미 타입(`Meters` vs `Seconds`, `UserId` vs `PostId`)이 뒤섞여도 에러가 없다. Swift에서 typealias가 아닌 struct로 감싸던 값들이 TS에선 전부 호환돼버린다. 중요한 ID 타입은 branded type(`string & { __brand: 'UserId' }`) 고려.
- **`as` 캐스트는 검증이 아니다.** Swift `as!`처럼 크래시라도 나면 다행인데, TS의 `as`는 런타임에 아무것도 안 한다. 틀린 캐스트는 한참 뒤 엉뚱한 곳에서 터진다. `as`가 필요해 보이면 대개 타입 가드나 제네릭으로 풀 수 있다.
- **catch의 에러는 `unknown`.** JS는 아무 값이나 throw할 수 있어서(`throw 'oops'`도 합법) `catch (e)`의 `e`는 `unknown`이다. `e.message` 접근 전에 `e instanceof Error` 검사가 필요하다.
- **enum은 함정 카드.** TS `enum`은 런타임 객체를 생성하는 예외적 기능인데 여러 특이 거동 때문에 기피되는 추세. 문자열 리터럴 유니온(`type Status = 'a' | 'b'`) 또는 `as const` 객체가 표준 대체재.
- **제네릭은 런타임에 없다.** `T`로 분기(`if (x is T)` 같은 것)는 불가능. Kotlin의 type erasure와 같은 제약. 런타임 분기는 값 기반(판별 필드)으로.
- **strict 모드 확인.** `tsconfig.json`의 `"strict": true`가 꺼진 프로젝트의 TS는 절반짜리다. `strictNullChecks` 없는 TS는 optional 안전성이 통째로 사라진다.
- **컴파일 통과 ≠ 배포 가능.** RN에서 타입 에러가 있어도 [[Metro]]는 [[Bundle]]을 만들어준다(Babel이 타입을 검사 없이 벗겨내기 때문). 타입 검사는 별도로 `tsc --noEmit`을 CI에 걸어야 강제된다.

## 🔗 관련 노트

- [[02-Promise와-async-await]] — `Promise<T>`와 catch의 unknown
- [[04-모듈-시스템]] — `import type`, 타입의 모듈 경계
- [[06-패키지-매니저와-node_modules]] — `@types/*` 패키지, devDependencies
