# 기획 언어 프로토타입 v0.1

> AI 기반 소프트웨어 개발을 위한 구조화된 기획 언어 — 문법 명세와 예제

---

## 이 프로토타입에 대하여

이 프로토타입은 사람→AI, AI→AI, 사람→사람 커뮤니케이션을 하나의 포맷으로 통합하는 기획 언어의 초기 설계다. [리서치 리포트](/research_report_kr.md)에서 분석한 수십 개의 기존 도구, 프로토콜, 학술 연구에서 검증된 패턴을 결합했다.

### 차용한 검증된 패턴

| 출처 | 차용한 패턴 | 이 언어에서의 구현 |
|------|-----------|-----------------|
| AGENTS.md / CLAUDE.md | Markdown 기반, 스키마 최소화 | `.plan` 파일 = 확장된 Markdown |
| Gherkin (BDD) | Given-When-Then 키워드 접두 | 수용 기준 + 엣지 케이스 기술 |
| EARS (Rolls-Royce) | 키워드 제약 자연어 | 12개 핵심 키워드 시스템 |
| RFC 2119 | MUST/SHOULD/MAY 의무 수준 | `Then:` 절의 `[MUST/SHOULD/MAY]` |
| Cursor MDC | YAML 프론트매터 메타데이터 | 파일 최상단 프론트매터 |
| CrewAI | 타입 태스크 스키마 | Task 블록 + JSON Schema 변환 |
| HCL | 이중 표현 (사람 + 기계) | Markdown 호환 + 구조적 파싱 |

### 우선 구현한 3가지 축

1. **Feature / Story / Task 계층 구조** — 기획의 3단 분해
2. **불확실성 표현** — `?pending`, `?assumption`, `?alternative`, `?risk` 마커
3. **의존성 및 상태 관리** — `Needs:` / `Blocks:` + 6단계 상태 머신

---

## 파일 구조

```
prototype/
├── README.md                          ← 이 파일
├── GRAMMAR.md                         ← 문법 명세 (핵심 문서)
└── examples/
    ├── project-index.plan             ← 프로젝트 전체 의존성 맵
    ├── feat-social-login.plan         ← 예제 1: 소셜 로그인 (draft)
    ├── feat-payment.plan              ← 예제 2: 결제 시스템 (blocked)
    └── feat-email-auth.plan           ← 예제 3: 이메일 인증 (in_progress)
```

---

## 읽는 순서

1. **[GRAMMAR.md](./GRAMMAR.md)** — 문법 명세를 먼저 읽는다. 12개 키워드, 불확실성 시스템, 상태 모델을 이해한다.
2. **[feat-social-login.plan](./examples/feat-social-login.plan)** — 가장 전형적인 예제. Feature→Story→Task 계층, Edge 케이스, 불확실성 마커, 의존성을 모두 보여준다.
3. **[feat-payment.plan](./examples/feat-payment.plan)** — `blocked` 상태, 무거운 `?pending` 사용, `?alternative`와 `?risk`의 실전 활용을 보여준다.
4. **[feat-email-auth.plan](./examples/feat-email-auth.plan)** — `in_progress` 상태의 비교적 안정된 기획. 불확실성이 적고 의존성 체인의 시작점 역할을 한다.
5. **[project-index.plan](./examples/project-index.plan)** — 파일 간 교차 참조와 의존성 그래프, 전체 불확실성 집계를 보여준다.

---

## 핵심 설계 결정과 근거

### 왜 Markdown인가?
- 토큰 효율성: JSON 대비 34~38% 절약, XML 대비 45% 절약
- 채택: 개발자 도구 생태계 전체가 Markdown 지원 (GitHub, VS Code, Notion, ...)
- Graceful degradation: DSL을 모르는 도구에서도 문서로 읽힘

### 왜 줄 시작 키워드인가?
- Gherkin과 EARS에서 검증: 고정 위치 키워드 + 자유 자연어가 파싱과 가독성 모두 달성
- LLM 추론 보존: Tam et al. (2024) 연구에 따르면, 엄격한 구조 제약은 추론을 저하시킴. 키워드 접두만으로 구조를 잡고 나머지는 자연어로 유지

### 왜 불확실성이 1급 시민인가?
- 기획은 본질적으로 불확실성을 포함. 기존 포맷(PRD, Jira, Confluence)은 불확실성을 주석이나 관례로만 처리
- `?pending`이 있는 한 `ready` 상태로 전이 불가 → 기획 완성도의 기계적 검증 가능
- 불확실성 집계 → PM의 의사결정 우선순위 가시화

### 왜 6단계 상태인가?
- `draft → ready` 사이에 불확실성 해소를 강제하여, "준비 안 된 기획의 조기 구현" 문제를 구조적으로 방지
- `blocked` 상태가 독립적으로 존재하여 외부 의존성 병목을 명시적으로 추적

---

## 의도적으로 v0.1에서 제외한 것

이 프로토타입은 10~15개 핵심 구성요소 중 **3가지 축**에 집중했다. 다음은 의도적으로 제외한 것들이며, 후속 버전에서 다룰 수 있다:

| 제외된 요소 | 제외 이유 | 우선순위 |
|------------|----------|---------|
| Mermaid 다이어그램 통합 문법 | 핵심 구조에 비해 부가적 | 중간 |
| `$ref` 스타일 타입 재사용 | 복잡도 대비 초기 가치 낮음 | 낮음 |
| AI 에이전트 위임 프로토콜 | A2A/MCP 호환 레이어는 별도 설계 필요 | 높음 |
| LSP 서버 / 파서 구현 | 이번 범위는 문서 수준 | 높음 |
| `.cursorrules`, `CLAUDE.md` 트랜스파일러 | 도구 연동은 파서 이후 | 중간 |
| 다국어 키워드 | Gherkin처럼 `Goal:` → `목표:` 매핑 가능하나 초기엔 영어 | 낮음 |

---

## 다음 단계 (후보)

1. **파서/린터 구현** — TypeScript 또는 Python으로 `.plan` → AST → JSON 변환기 제작
2. **VS Code 확장** — 구문 하이라이팅 + 린트 규칙 실시간 검증
3. **AI 도구 호환 레이어** — `.plan` → CLAUDE.md / .cursorrules 변환
4. **실제 프로젝트 적용** — Manyfast 실제 기획에 적용하여 피드백 수집
5. **언어 이름 확정** — 포지셔닝과 브랜딩 결정
