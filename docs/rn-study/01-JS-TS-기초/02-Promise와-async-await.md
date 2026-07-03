# Promise와 async/await

> Swift async/await·Kotlin coroutines와 문법은 닮았는데, 왜 실행 모델은 전혀 다르며 무엇을 조심해야 하는가?

## iOS/AOS 대응 개념

| JS 개념 | iOS (Swift) | Android (Kotlin) | 차이 |
|---|---|---|---|
| 콜백 지옥 | completion handler 지옥 | callback 지옥 | 동일한 역사 |
| `Promise<T>` | `Task<T, Error>` (대략) | `Deferred<T>` | Promise는 **생성 즉시 실행**, 취소 불가 |
| `async` 함수 | `async` 함수 | `suspend` 함수 | JS는 반환 타입이 항상 `Promise<T>` |
| `await` | `await` | (suspend 호출은 키워드 없음) | JS의 await는 suspension point라는 점은 동일 |
| `Promise.all` | `async let` 묶음 / `withThrowingTaskGroup` | `awaitAll(async{}, async{})` | 하나 실패 시 즉시 reject |
| `Promise.allSettled` | TaskGroup에서 Result 수집 | `runCatching` + awaitAll | 전부 완료까지 대기, 실패 포함 |
| `Promise.race` | 직접 대응 없음 (TaskGroup 첫 결과) | `select {}` | 첫 settle(성공이든 실패든)을 채택 |
| 실행 위치 | cooperative thread pool | Dispatchers (스레드 풀) | **JS는 스레드 풀이 없다. 전부 JS 스레드 1개** |
| 취소 | `Task.cancel()` + 협조적 취소 | `Job.cancel()` | **Promise에는 취소 개념이 없다** (`AbortController`는 별도 규약) |
| unhandled rejection | 컴파일러가 `try` 강제 | `CoroutineExceptionHandler` | JS는 컴파일 타임 강제가 없어 조용히 샌다 |

## 왜 이렇게 설계됐나

초기 JS 비동기는 전부 콜백이었다. 콜백은 (1) 중첩이 깊어지고, (2) 에러 전파 경로가 제각각이고, (3) "언젠가 완료되는 값"을 변수처럼 다룰 수 없었다. Promise는 이 셋을 해결하기 위해 **"미래의 값(또는 에러)을 담는 일급 객체"**로 도입됐고(ES2015 표준화), async/await(ES2017)는 그 위에 얹힌 문법 설탕이다 — Kotlin coroutines가 콜백 기반 API 위에 suspend를 얹은 것과 같은 궤적이다.

Swift/Kotlin과 달리 스레드 풀을 도입하지 않은 이유는 단순하다: 이벤트 루프 + 싱글 스레드 모델([[01-이벤트루프와-싱글스레드]])을 유지하면 락 없이 동시성을 표현할 수 있기 때문이다. Promise는 "다른 스레드에서 실행"이 아니라 **"완료 시 마이크로태스크 큐에 콜백을 넣는 예약"**이다.

## 동작 원리

### Promise의 3가지 상태

- `pending` — 대기 중
- `fulfilled` — 값과 함께 완료
- `rejected` — 에러와 함께 완료

`fulfilled`/`rejected`를 합쳐 *settled*라 부른다. **한 번 settle되면 영원히 불변**이다. 두 번 resolve해도 두 번째는 무시된다.

중요한 성질:

1. **즉시 실행(eager)**: `new Promise(executor)`의 executor는 생성 순간 동기로 실행된다. Swift의 `Task {}`가 생성 즉시 스케줄되는 것과 비슷하고, Kotlin의 cold `flow`나 `lazy` coroutine과는 다르다. "Promise를 만들어두고 나중에 시작"은 불가능하다 — 그래서 지연 실행이 필요하면 `() => Promise<T>` 팩토리 함수를 넘긴다.
2. **콜백은 마이크로태스크**: `.then(cb)`의 `cb`는 Promise가 이미 fulfilled여도 동기 실행되지 않고 항상 마이크로태스크 큐로 간다. 실행 순서가 예측 가능해진다.
3. **체이닝**: `.then()`은 항상 *새* Promise를 반환한다. 콜백이 값을 반환하면 그 값으로 fulfill, Promise를 반환하면 그 Promise를 따라간다(자동 평탄화). 콜백이 throw하면 반환된 Promise가 reject된다 — 에러가 체인을 타고 가장 가까운 `.catch()`까지 전파된다.

### async/await = Promise의 문법 설탕

- `async function f(): Promise<T>` — **async 함수는 무엇을 return하든 항상 Promise를 반환한다.** `return 42`는 `Promise<number>`가 된다. throw하면 rejected Promise가 된다.
- `await p` — `p`가 settle될 때까지 *이 함수의 실행만* 일시 정지한다. 스레드는 절대 멈추지 않고, 함수의 나머지 부분이 마이크로태스크로 예약된다. Kotlin suspend 함수의 CPS 변환과 원리가 같다.
- async 함수의 본문은 **첫 await까지 동기 실행**된다. 호출 즉시 부수효과가 일어난다는 뜻이다.

### 조합 함수

```
Promise.all([a, b, c])        → 전부 fulfill되면 [값들], 하나라도 reject되면 즉시 reject
Promise.allSettled([a, b, c]) → 전부 settle까지 대기, [{status, value|reason}] 반환. 절대 reject 안 함
Promise.race([a, b])          → 가장 먼저 settle된 것을 그대로 채택 (실패도 포함)
Promise.any([a, b])           → 가장 먼저 fulfill된 것. 전부 reject면 AggregateError
```

주의: `Promise.all`이 reject돼도 **나머지 Promise는 취소되지 않고 계속 실행된다**. 결과만 버려질 뿐이다. structured concurrency(자식 취소 전파)가 없다는 것이 Swift TaskGroup/Kotlin coroutineScope과의 결정적 차이다.

## 코드 예시

```typescript
// 콜백 → Promise → async/await 진화
declare function fetchUserLegacy(
  id: string,
  onSuccess: (u: User) => void,
  onError: (e: Error) => void,
): void;

interface User { id: string; name: string }
interface Post { id: string; title: string }

// 1) 콜백 API를 Promise로 감싸기 (completion handler → async 브릿징과 동일)
function fetchUser(id: string): Promise<User> {
  return new Promise((resolve, reject) => {
    fetchUserLegacy(id, resolve, reject);
  });
}

// 2) async/await + 순차 vs 병렬
async function loadProfile(userId: string): Promise<{ user: User; posts: Post[] }> {
  const user = await fetchUser(userId);           // 순차: user가 필요하니까

  // 병렬: 서로 의존 없는 요청은 먼저 시작해두고 나중에 await
  const [posts, friends] = await Promise.all([
    fetchPosts(user.id),
    fetchFriends(user.id),
  ]);
  void friends;
  return { user, posts };
}

// 3) 에러 처리 — 동기 코드와 똑같이 try/catch
async function safeLoad(userId: string) {
  try {
    return await loadProfile(userId);
  } catch (e) {
    // e는 unknown 타입 — narrowing 필요 ([[05-TypeScript-핵심]])
    if (e instanceof Error) console.error(e.message);
    return null;
  }
}

// 4) allSettled — 일부 실패를 허용하는 배치 처리
async function loadMany(ids: string[]) {
  const results = await Promise.allSettled(ids.map(fetchUser));
  const ok = results
    .filter((r): r is PromiseFulfilledResult<User> => r.status === 'fulfilled')
    .map((r) => r.value);
  return ok;
}

// 5) race로 타임아웃 구현 (관용구)
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms),
    ),
  ]);
}

declare function fetchPosts(id: string): Promise<Post[]>;
declare function fetchFriends(id: string): Promise<User[]>;
```

의도적 fire-and-forget 표기:

```typescript
// 결과를 기다리지 않는 것이 "의도"라면 void 연산자로 명시한다.
// no-floating-promises lint를 통과하면서 리뷰어에게도 의도가 전달된다.
void analytics.track('screen_view', { name: 'Home' });

// 단, 에러까지 버려지므로 최소한의 안전망을 붙이는 게 낫다
analytics.track('screen_view', { name: 'Home' }).catch(() => {});
```

## 함정 (Pitfalls)

- **await 빠뜨림 — 조용한 버그의 왕.** `savePreferences(prefs)` 앞에 `await`를 빼먹어도 **컴파일 에러도, 런타임 에러도 없다.** 함수는 실행되지만 완료를 기다리지 않고 다음 줄로 넘어가며, 그 안에서 throw된 에러는 try/catch를 그냥 통과한다. Swift에서는 `await` 없이 async 함수를 호출하는 것 자체가 컴파일 에러라 이 부류의 버그가 원천 차단되지만 JS/TS는 아니다. 방어책: ESLint `@typescript-eslint/no-floating-promises` 규칙을 반드시 켤 것.
- **try/catch가 못 잡는 경우.** `try { fetchUser(id).then(...) } catch {}` — Promise 내부의 reject는 동기 catch로 잡히지 않는다. `await`했을 때만 try/catch로 흘러온다. `.then()` 체인에서는 `.catch()`로 잡아야 한다.
- **unhandled rejection.** 아무도 catch하지 않은 rejected Promise는 unhandled rejection이 된다. RN 디버그 모드에선 경고(LogBox)가 뜨지만 release에선 조용히 사라질 수 있다. 전역 훅(`global.onunhandledrejection` 상당)은 환경마다 다르니 공식 문서 확인.
- **병렬인 줄 알았는데 순차.** `const a = await f(); const b = await g();`는 f 완료 후 g 시작이다. 의존이 없다면 `Promise.all([f(), g()])`로. 반대로, 루프 안 `await`도 순차다 — `for (const id of ids) await fetch(id)` vs `Promise.all(ids.map(fetch))`.
- **취소가 없다.** 화면을 떠나도 진행 중인 Promise는 계속 실행되고, 완료 콜백이 언마운트된 컴포넌트의 [[State]]를 건드리려 할 수 있다. `AbortController`를 fetch에 넘기거나, [[Hook]]의 cleanup에서 플래그로 무시하는 패턴을 쓴다. `Task.cancel()` 같은 일급 취소를 기대하면 안 된다.
- **executor 안의 throw만 reject가 된다.** `new Promise` executor에서 *비동기 콜백 내부*에서 throw하면 reject로 연결되지 않고 그냥 샌다. executor 안에서는 반드시 `reject(e)`를 명시적으로 호출.
- **스레드 풀 착각 재차 주의.** `await heavyCalc()`라고 써도 `heavyCalc`가 동기 연산이면 JS 스레드를 그대로 점유한다. await는 마법이 아니라 "Promise가 settle될 때까지 양보"일 뿐이다.

## 관련 노트

- [[01-이벤트루프와-싱글스레드]] — Promise 콜백이 마이크로태스크로 실행되는 무대
- [[03-클로저와-스코프]] — 비동기 콜백이 변수를 캡처하는 방식
- [[05-TypeScript-핵심]] — `Promise<T>` 타입, catch의 `unknown`
