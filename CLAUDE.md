# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

`.plan` 확장자를 사용하는 구조화된 기획 언어(DSL)의 파서, 린터, CLI, LSP 서버, VS Code 확장을 포함하는 모노레포 프로젝트. Markdown 호환 문법으로 Feature → Story → Task 3단 계층 구조, 불확실성 마커(`?pending`, `?assumption`, `?alternative`, `?risk`), 의존성(`Needs:`, `Blocks:`), GWT 행동 명세(`Given:`, `When:`, `Then:`)를 표현한다.

## 빌드 및 테스트

```bash
# 코어 빌드 (src/ → dist/)
npx tsc -p tsconfig.build.json

# LSP 서버 빌드
npx tsc -p tsconfig.build.json && cd packages/server && npx tsc -p tsconfig.json

# VS Code 확장 빌드 (전체 파이프라인)
npx tsc -p tsconfig.build.json && cd packages/server && npx tsc -p tsconfig.json && cd ../vscode && node esbuild.mjs

# 테스트
npx vitest run                          # 코어 테스트
cd packages/server && npx vitest run    # 서버 테스트

# 단일 테스트 파일 실행
npx vitest run tests/parser/scanner.test.ts

# CLI 실행
npx tsx bin/plan.ts parse <file>
npx tsx bin/plan.ts lint <files...>
npx tsx bin/plan.ts lint-project <dir>
npx tsx bin/plan.ts uncertainty <files...>
```

## 아키텍처

```
.plan 파일 (텍스트)
    ↓ Scanner → RawLine[] + Frontmatter 경계
    ↓ LineClassifier → ClassifiedLine[] (15+ 줄 타입)
    ↓ InlineParser → 불확실성/의무수준/참조/액터 추출
    ↓ FrontmatterParser → YAML 메타데이터 검증
    ↓ Parser → PlanDocument (계층적 AST)
    ↓ LintEngine → Diagnostic[] (10개 시맨틱 규칙)
    ↓ Reporter → 텍스트/JSON/불확실성 리포트
```

### 모노레포 구조

| 패키지 | 경로 | 역할 |
|--------|------|------|
| **plan-lang** (루트) | `/` | 코어 파서, 린터, CLI, AST 타입 |
| **plan-lang-server** | `packages/server/` | LSP 서버 (vscode-languageserver) |
| **plan-lang-vscode** | `packages/vscode/` | VS Code 확장 (클라이언트 + TextMate 문법) |

서버 패키지는 코어를 `"plan-lang": "file:../../"`로 로컬 참조한다.

### 파서 파이프라인 (src/parser/)

파서는 5단계 파이프라인으로 구성된다. 각 단계가 독립적으로 테스트 가능:

1. **scanner.ts** — 원본 텍스트를 `RawLine[]`로 토큰화, YAML 프론트매터 경계 추출
2. **line-classifier.ts** — 각 줄을 `ClassifiedLine`으로 분류 (heading, intent, behavior, dependency, edge, uncertainty 등)
3. **inline-parser.ts** — 텍스트 내 인라인 요소 파싱: `?pending("msg")`, `[MUST]`, `@actor`, `[feat-id#fragment]`
4. **frontmatter-parser.ts** — YAML 메타데이터 검증 (type/id/status 필수, priority/tags 등 선택)
5. **parser.ts** — ClassifiedLine[]을 순회하며 계층적 AST(`PlanDocument`) 빌드

진입점 `parsePlanFile(source, filePath?)`는 `src/parser/index.ts`에서 이 전체를 조합한다.

### 린터 규칙 (src/linter/rules/)

| 규칙 ID | 심각도 | 설명 | 크로스파일 |
|---------|--------|------|-----------|
| PLAN-001 | error | Feature에 `Goal:` 누락 | |
| PLAN-002 | error | Story에 `When:` 또는 `Then:` 누락 | |
| PLAN-003 | error | Task에 `Assign:` 누락 | |
| PLAN-004 | error | `status: ready`인데 `?pending` 존재 | |
| PLAN-005 | warning | Story에 `Edge:` 없음 | |
| PLAN-006 | warning | `Then:`에 의무수준 `[MUST/SHOULD/MAY]` 없음 | |
| PLAN-007 | warning | `?assumption`이 30일 이상 미해소 | |
| PLAN-008 | info | `Blocks:` 대상이 아직 draft | O |
| PLAN-009 | error | `Needs:` 참조 ID가 프로젝트에 없음 | O |
| PLAN-010 | warning | Feature에 `Metric:` 없음 | |

새 규칙 추가: `LintRule` 인터페이스 구현 후 `src/linter/index.ts`의 `builtinRules` 배열에 등록.

린트 지시자로 규칙 억제 가능: `<!-- @lint-disable PLAN-001 -->` ... `<!-- @lint-enable PLAN-001 -->`

### LSP 서버 (packages/server/src/)

- **server.ts** — 진입점. 문서 수명주기(open/change/save/close), 200ms 디바운싱, 워크스페이스 로딩
- **document-manager.ts** — AST 캐시, id↔uri 매핑, 프로젝트 전체 문서 관리
- **diagnostics.ts** — 파싱 에러 + 린트 결과를 LSP 진단으로 변환
- **hover.ts** — 키워드, 의무수준, 불확실성 마커, 참조, 액터에 대한 호버 정보
- **definition.ts** — `[feat-id]` → 대상 파일, `[feat-id#fragment]` → 특정 Story/Task로 이동
- **symbols.ts** — Feature/Story/Task/Edge를 문서 심볼로 변환 (아웃라인 패널)
- **folding.ts** — 프론트매터, Feature/Story/Task/Edge 블록, 불확실성 블록 접기
- **ast-query.ts** — 커서 위치 → AST 컨텍스트 매핑
- **completion.ts** — 프론트매터 키/값, 헤딩, 참조, 액터, 키워드, 의무수준 자동완성
- **position-utils.ts** — plan-lang 1-based ↔ LSP 0-based 좌표 변환

## 핵심 타입 (src/types/ast.ts)

- `PlanDocument` — 루트: frontmatter + feature + errors + comments
- `FeatureBlock` / `StoryBlock` / `TaskBlock` — 3단 계층 노드
- `EdgeBlock` — Story 내 엣지 케이스 (Given/When/Then)
- `UncertaintyBlock` — `?pending "..." ... ?end` 블록 레벨 불확실성
- `UncertaintyMarker` — 인라인 `?pending("msg")` 마커
- `Obligation` — `[MUST]`, `[SHOULD]`, `[MAY]`
- `ClassifiedLine` — 줄 타입 + 키워드 + 값 + 인덴트
- `Diagnostic` — 린트 결과 (ruleId, severity, message, range)

## 테스트

- 프레임워크: **vitest** (globals: true)
- 코어 테스트: `tests/` (parser/, linter/, project/)
- 서버 테스트: `packages/server/tests/`
- 픽스처: `tests/fixtures/*.plan` — 실제 .plan 파일을 `loadFixture(name)`으로 로드
- 테스트 패턴: 파서 단계별 유닛 테스트 + 픽스처 기반 통합 테스트

## .plan 문법 핵심 요약

- **12개 키워드**: `Goal:`, `Persona:`, `Metric:`, `Given:`, `When:`, `Then:`, `Needs:`, `Blocks:`, `Edge:`, `Assign:`, `Verify:`, `?marker`
- **계층**: `# Feature:` → `## Story:` → `### Task:` (Markdown 헤딩 레벨로 구분)
- **참조**: `[feat-id]` (plan 간), `[feat-id#fragment]` (특정 Story/Task), `[external]` (외부), `[doc:id]` (문서)
- **액터**: `@name` (사람/팀/AI 에이전트/페르소나)
- **의무수준**: `Then:` 절 끝에 `[MUST]`, `[SHOULD]`, `[MAY]`
- **불확실성**: 인라인 `?pending("msg")` 또는 블록 `?pending "msg" ... ?end`
- **상태**: `draft → ready → in_progress → done`, `blocked ↔ in_progress`, `deprecated` (terminal)
- **상태 전이 제약**: `?pending` 존재 시 `draft → ready` 전이 불가
- 문법 전체 명세: `examples/files/GRAMMAR.md`
