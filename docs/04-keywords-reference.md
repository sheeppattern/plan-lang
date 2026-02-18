# 12개 키워드 완전 가이드

Plan Language는 12개의 핵심 키워드로 기획의 구조를 잡는다. 모든 키워드는 줄 시작에 오고, 뒤에 콜론(`:`)과 공백, 그리고 자연어가 온다.

```
키워드: 자연어 설명
```

## 의도 키워드 — "왜"를 표현

기획의 목적과 방향을 기술하는 키워드다.

### Goal:

**역할**: 이 기능/스토리가 달성하려는 목표

| 항목 | 내용 |
|------|------|
| 사용 위치 | Feature (필수), Story (선택) |
| 관련 린트 | PLAN-001: Feature에 Goal이 없으면 error |

**좋은 예:**
```markdown
Goal: 신규 유저의 가입 허들을 낮춰 가입 전환율을 높인다
Goal: 레거시 세션 인증을 JWT로 전환하여 스케일 아웃 기반을 마련한다
```

**나쁜 예:**
```markdown
Goal: 소셜 로그인 구현      # 목표가 아니라 수단을 기술함
Goal: 기능 개선              # 너무 모호함
```

Goal은 "왜 이 기능이 필요한가?"에 대한 답이다. 구현 방법이 아니라 달성하려는 결과를 적어야 한다.

---

### Persona:

**역할**: 대상 사용자 또는 행위자

| 항목 | 내용 |
|------|------|
| 사용 위치 | Feature, Story |
| 관련 린트 | 없음 (선택 키워드) |

**문법:**
```markdown
Persona: @참조 — 설명
```

**예시:**
```markdown
Persona: @new_user — 앱을 처음 설치한 사용자, 복잡한 가입 절차에 거부감이 큼
Persona: @paid_user — 무료 체험 후 유료 전환을 결정한 사용자
Persona: @existing_user — 이메일로 가입한 기존 사용자
```

`@` 참조로 페르소나를 정의하면, 이후 `Given:` 등에서 같은 `@참조`를 재사용할 수 있다.

---

### Metric:

**역할**: 정량적 성공 지표 (측정 가능해야 함)

| 항목 | 내용 |
|------|------|
| 사용 위치 | Feature |
| 관련 린트 | PLAN-010: Feature에 Metric이 없으면 warning |

**좋은 예:**
```markdown
Metric: signup_conversion_rate > 40%
Metric: auth_api_latency_p99 < 200ms
Metric: payment_success_rate > 98%
```

**나쁜 예:**
```markdown
Metric: 사용자 만족도 향상    # 측정 불가능
Metric: 빠른 응답            # 정량적이지 않음
```

Metric은 숫자로 측정할 수 있어야 한다. 불확실한 지표에는 `?assumption`을 붙일 수 있다:

```markdown
Metric: checkout_to_payment_time < 60s ?assumption("업계 평균 45~90초 기반")
```

---

## 행동 키워드 — Given-When-Then

Gherkin(BDD)에서 검증된 패턴이다. 사용자 시나리오의 전제-행동-결과를 기술한다.

### Given:

**역할**: 전제 조건 (시나리오가 시작되기 전의 상태)

| 항목 | 내용 |
|------|------|
| 사용 위치 | Story, Edge |
| 관련 린트 | 없음 (선택 키워드) |

**예시:**
```markdown
Given: @new_user가 가입 화면에 도달한 상태
Given: @paid_user가 유료 플랜을 선택한 상태
Given: @existing_user가 레거시 세션 쿠키로 인증된 상태
```

Given은 생략할 수 있다. 맥락이 명확하다면 When부터 시작해도 된다.

---

### When:

**역할**: 트리거 행동 (사용자 또는 시스템의 액션)

| 항목 | 내용 |
|------|------|
| 사용 위치 | Story (필수), Edge |
| 관련 린트 | PLAN-002: Story에 When이 없으면 error |

**예시:**
```markdown
When: "Google로 계속하기" 버튼을 탭
When: 카드 정보를 입력하고 "결제하기" 버튼을 탭
When: 마이그레이션 배포 후 첫 API 요청
```

When은 "무슨 일이 일어나는가?"에 대한 답이다. Story에는 반드시 1개 이상의 When이 있어야 한다.

---

### Then:

**역할**: 기대 결과 + 의무 수준

| 항목 | 내용 |
|------|------|
| 사용 위치 | Story (필수), Edge |
| 관련 린트 | PLAN-002: Story에 Then이 없으면 error |
| | PLAN-006: Then에 의무 수준이 없으면 warning |

**문법:**
```markdown
Then: 기대 결과 설명 [MUST|SHOULD|MAY]
```

**예시:**
```markdown
Then: Google OAuth 인증 후 3초 이내 홈 화면으로 이동 [MUST]
Then: 사용자 프로필에 이메일과 프로필 이미지가 자동 세팅 [SHOULD]
Then: 환영 온보딩 투어가 시작 [MAY]
```

**의무 수준 (RFC 2119):**

| 수준 | 의미 |
|------|------|
| `[MUST]` | 필수. 미충족 시 수용 기준 실패 |
| `[SHOULD]` | 권장. 합리적 이유가 있으면 생략 가능 |
| `[MAY]` | 선택. 구현 여부 자유 |

의무 수준이 없으면 린트 경고(PLAN-006)가 발생한다. 하나의 Story에 여러 Then을 적을 수 있다.

---

## 의존성 키워드 — 선후행 관계

### Needs:

**역할**: 이것이 시작되려면 필요한 것 (선행 조건)

| 항목 | 내용 |
|------|------|
| 사용 위치 | Feature, Story, Task |
| 관련 린트 | PLAN-009: 참조된 ID가 존재하지 않으면 error |

**문법:**
```markdown
Needs: [참조] 설명
```

**예시:**
```markdown
Needs: [feat-email-auth] 이메일 인증 시스템 리팩토링 완료
Needs: [external] Google OAuth 클라이언트 ID 발급
Needs: [feat-payment#task-pg-api] PG사 API 연동 완료
```

`[external]` 참조는 시스템 밖 의존성이므로 PLAN-009 검사에서 제외된다.

---

### Blocks:

**역할**: 이것이 완료되어야 시작 가능한 것 (후행 영향)

| 항목 | 내용 |
|------|------|
| 사용 위치 | Feature, Story, Task |
| 관련 린트 | PLAN-008: 참조된 파일이 draft면 info |

**예시:**
```markdown
Blocks: [feat-account-linking] 계정 연동 기능
Blocks: [feat-billing-dashboard] 결제 내역 대시보드
```

Blocks는 "이것을 완료해야 저것이 시작 가능하다"는 정보를 제공한다. 프로젝트의 크리티컬 패스를 파악하는 데 유용하다.

---

## 태스크 키워드 — 위임과 검증

### Assign:

**역할**: 담당자 또는 AI 에이전트

| 항목 | 내용 |
|------|------|
| 사용 위치 | Task (필수) |
| 관련 린트 | PLAN-003: Task에 Assign이 없으면 error |

**예시:**
```markdown
Assign: @backend-agent
Assign: @frontend-agent
Assign: @backend-agent ?pending("PG사 확정 후 담당 배정")
```

담당자가 아직 미정이면 `?pending`을 붙일 수 있다.

---

### Verify:

**역할**: 완료 확인 조건 (기계 검증 가능하면 좋음)

| 항목 | 내용 |
|------|------|
| 사용 위치 | Task |
| 관련 린트 | 없음 (권장이지만 필수 아님) |

**좋은 예:**
```markdown
Verify: `npm test -- --grep "oauth callback"` 전체 통과
Verify: Google OAuth 토큰 교환 성공 시 JWT 발급 확인
Verify: 멱등성 키 기반 중복 결제 방지 테스트 통과
```

**나쁜 예:**
```markdown
Verify: 잘 동작함         # 검증 불가능
Verify: 코드 리뷰 통과    # 주관적
```

Verify는 가능하면 기계가 자동으로 확인할 수 있는 조건(테스트 명령어, API 응답 등)으로 적는 것이 좋다. 하나의 Task에 여러 Verify를 적을 수 있다.

---

## 엣지 케이스 키워드

### Edge:

**역할**: 예외 시나리오 선언

| 항목 | 내용 |
|------|------|
| 사용 위치 | Story 내 |
| 관련 린트 | PLAN-005: Story에 Edge가 없으면 warning |

**문법:**
```markdown
Edge: "예외 상황 설명"
  Given: ...   (선택)
  When: ...
  Then: ...
```

**예시:**
```markdown
Edge: "이미 같은 이메일로 가입된 계정이 존재하는 경우"
  When: 반환된 이메일이 기존 계정의 이메일과 일치
  Then: 기존 계정 연동 확인 모달을 표시 [MUST]
  Then: 연동 과정에서 기존 계정 데이터 손실 없음 [MUST]
  Then: 사용자가 연동을 거부할 경우 새 계정 생성을 선택할 수 있음 [SHOULD]

Edge: "OAuth 인증 실패 (네트워크 에러, 사용자 취소)"
  When: Google OAuth 콜백이 에러를 반환하거나 사용자가 인증을 취소
  Then: 사용자에게 명확한 에러 메시지를 표시 [MUST]
  Then: 가입 화면으로 복귀, 이전 상태 보존 [MUST]
```

Edge 설명은 반드시 따옴표(`"..."`)로 감싸야 한다. Edge 내부에서도 Given-When-Then 패턴과 `[MUST/SHOULD/MAY]` 의무 수준을 사용할 수 있다.

---

## 불확실성 마커

### ?marker

**역할**: 불확실한 요소를 명시적으로 표시

| 항목 | 내용 |
|------|------|
| 사용 위치 | 어디서든 |
| 관련 린트 | PLAN-004: status: ready인데 ?pending이 있으면 error |
| | PLAN-007: ?assumption이 30일 이상 미해소면 warning |

**4가지 유형:**

| 마커 | 용도 | 예시 |
|------|------|------|
| `?pending` | 미정, 결정 대기 | PG사 선정, 할인율 결정 |
| `?assumption` | 가정, 검증 필요 | 업계 평균 기반 추정치 |
| `?alternative` | 대안 존재, 선택 필요 | A방식 vs B방식 |
| `?risk` | 위험 요소, 모니터링 | 이탈률 변동 가능성 |

**인라인 형태:**
```markdown
Metric: 성공률 > ?assumption("95% — 업계 평균 기반 가정")
Assign: @backend-agent ?pending("PG사 확정 후 담당 배정")
```

**블록 형태:**
```markdown
?pending "결제 수단 추가 — 비즈니스팀 확인 필요"
  Given: 사용자가 결제 화면에 도달
  When: 새 카드를 등록
  Then: (미정)
?end

?alternative "연간 할인율 — 20% vs 30% vs 2개월 무료"
  Given: 월간 구독 사용자
  When: 연간 전환 버튼 탭
  Then: 할인이 적용된 연간 가격 표시 [MUST]
?end
```

---

## 키워드 조합 패턴

### 기본 패턴: Given-When-Then 시퀀스

```markdown
Given: 전제 조건
When: 사용자 행동
Then: 기대 결과 [MUST]
Then: 추가 결과 [SHOULD]
Then: 선택적 결과 [MAY]
```

하나의 Given에 여러 When-Then을 이어갈 수 있다. 하나의 When에 여러 Then을 적을 수 있다.

### Edge 내 중첩 패턴

```markdown
## Story: 메인 시나리오

Given: 전제 조건
When: 정상 동작
Then: 기대 결과 [MUST]

Edge: "예외 상황 A"
  When: 예외 트리거
  Then: 예외 처리 [MUST]

Edge: "예외 상황 B"
  Given: 특수한 전제
  When: 다른 예외 트리거
  Then: 다른 예외 처리 [MUST]
```

### 의존성 체인 패턴

```markdown
# Feature A
Blocks: [feat-b]

# Feature B
Needs: [feat-a]
Blocks: [feat-c]

# Feature C
Needs: [feat-b]
```

이런 체인을 통해 프로젝트의 크리티컬 패스를 파악할 수 있다.

---

## 키워드 퀵 레퍼런스

| # | 키워드 | 카테고리 | 필수 여부 | 사용 위치 |
|---|--------|----------|----------|----------|
| 1 | `Goal:` | 의도 | Feature 필수 | Feature, Story |
| 2 | `Persona:` | 의도 | 선택 | Feature, Story |
| 3 | `Metric:` | 의도 | 선택 (권장) | Feature |
| 4 | `Given:` | 행동 | 선택 | Story, Edge |
| 5 | `When:` | 행동 | Story 필수 | Story, Edge |
| 6 | `Then:` | 행동 | Story 필수 | Story, Edge |
| 7 | `Needs:` | 의존성 | 선택 | Feature, Story, Task |
| 8 | `Blocks:` | 의존성 | 선택 | Feature, Story, Task |
| 9 | `Edge:` | 시나리오 | 선택 (권장) | Story |
| 10 | `Assign:` | 태스크 | Task 필수 | Task |
| 11 | `Verify:` | 태스크 | 선택 (권장) | Task |
| 12 | `?marker` | 불확실성 | 선택 | 어디서든 |

**부가 수식자:**
- `[MUST]`, `[SHOULD]`, `[MAY]` — `Then:` 절의 의무 수준
- `@참조` — 사람/팀/AI 에이전트/페르소나
- `[id]` — `.plan` 파일 간 교차 참조

---

## 다음 단계

- [도구 활용 가이드](./05-tooling.md)에서 CLI와 VS Code 확장으로 실제 검증하는 법을 배우자
- [프로젝트 관리](./06-project-management.md)에서 여러 `.plan` 파일을 함께 관리하는 법을 알아보자
