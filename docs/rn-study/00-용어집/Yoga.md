# Yoga

**한 줄 정의**: Meta가 만든 C++ 크로스 플랫폼 레이아웃 엔진. 웹의 Flexbox 모델을 구현하며, RN의 모든 뷰 레이아웃(위치·크기)은 Yoga가 계산한다.

**iOS/AOS로 치면**: Auto Layout 엔진(Cassowary 솔버)이나 ConstraintLayout의 솔버에 해당하는 층. 단, 제약(constraint) 기반이 아니라 **Flexbox 박스 모델** 기반이다. UIStackView / LinearLayout의 "축 따라 배치 + 남는 공간 분배" 감각이 가장 가깝다.

## 설명

RN에서는 `style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}` 같은 스타일로 레이아웃을 선언한다. 이 선언을 실제 프레임(x, y, width, height)으로 바꾸는 것이 Yoga다.

[[Shadow Tree]]의 각 노드가 Yoga 노드를 품고 있고, [[Fabric]]이 레이아웃 패스를 돌리면 Yoga가 트리 전체의 프레임을 계산한다.

Flexbox 모델의 핵심만 요약하면: 부모가 **주축(main axis)** 을 정하고(`flexDirection: 'row' | 'column'`, RN 기본값은 column — 웹과 다르다), 자식들을 주축 방향으로 배치한다.

- `flexDirection` — 주축 방향. UIStackView의 axis, LinearLayout의 orientation.
- `justifyContent` — 주축 방향 정렬. UIStackView의 distribution에 근사.
- `alignItems` — 교차축 정렬. UIStackView의 alignment, LinearLayout의 gravity에 근사.
- `flex: 1` — "남는 공간을 이 비율로 차지하라". layout_weight와 같은 발상.

Auto Layout과의 사고방식 차이가 중요하다. Auto Layout은 "임의의 뷰 쌍 사이의 제약 방정식"을 푸는 범용 솔버라 표현력이 높지만 제약 충돌·우선순위 문제가 따라온다. Flexbox는 **부모→자식 단방향 트리 순회**로 계산되는 더 단순한 모델이다.

형제끼리 직접 제약을 걸 수 없고, 모든 관계가 부모의 배치 규칙으로 표현된다. 처음에는 답답할 수 있지만, 레이아웃이 깨졌을 때 원인 추적이 단순하다는 장점이 있다.

Yoga가 C++ 단일 구현이라는 점이 크로스 플랫폼의 핵심이다. 같은 스타일 입력이면 iOS와 Android에서 같은 프레임이 나온다. "왜 RN 레이아웃은 양 플랫폼에서 (거의) 똑같이 나오는가"의 답이 Yoga다.

웹 CSS Flexbox와는 대체로 호환되지만 100% 동일하지는 않으므로(기본값 차이 등), 웹 지식과 어긋나는 동작을 보면 공식 문서 확인.

절대 위치가 필요하면 `position: 'absolute'`를 쓸 수 있고, 이 역시 Yoga가 처리한다. RN에서 frame을 직접 세팅하는 API는 없다 — 레이아웃은 항상 스타일 선언 → Yoga 계산의 경로를 탄다.

## 관련
[[Shadow Tree]] · [[Fabric]] · [[New Architecture]] · [[Props]]
