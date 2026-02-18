# 프로그래밍 API 레퍼런스

Plan Language의 파서, 린터, 프로젝트 관리 기능을 TypeScript/JavaScript에서 프로그래밍 방식으로 사용할 수 있다.

## 설치 및 임포트

```typescript
import {
  parsePlanFile,
  LintEngine,
  loadProject,
  resolveReferences,
  collectUncertainty,
  formatUncertaintyReport,
  walkAST,
} from 'plan-lang';
```

---

## parsePlanFile()

`.plan` 파일 소스를 파싱하여 `PlanDocument` AST를 반환한다.

```typescript
function parsePlanFile(source: string, filePath?: string): PlanDocument;
```

**매개변수:**
| 이름 | 타입 | 설명 |
|------|------|------|
| `source` | `string` | `.plan` 파일의 원시 텍스트 |
| `filePath` | `string` (선택) | 파일 경로 (에러 메시지에 사용) |

**반환값:** `PlanDocument`

**사용 예:**

```typescript
import { parsePlanFile } from 'plan-lang';
import fs from 'node:fs';

const source = fs.readFileSync('feat-social-login.plan', 'utf-8');
const doc = parsePlanFile(source, 'feat-social-login.plan');

// 프론트매터 접근
console.log(doc.frontmatter?.id);       // "feat-social-login"
console.log(doc.frontmatter?.status);   // "draft"
console.log(doc.frontmatter?.tags);     // ["auth", "onboarding", "mvp"]

// Feature 접근
console.log(doc.feature?.title);        // "소셜 로그인"
console.log(doc.feature?.intents);      // Goal, Persona, Metric 라인 배열

// Story 접근
const stories = doc.feature?.stories || [];
for (const story of stories) {
  console.log(story.title);            // "Google 계정으로 가입"
  console.log(story.behaviors);        // Given, When, Then 라인 배열
  console.log(story.edges);            // Edge 블록 배열
  console.log(story.tasks);            // Task 블록 배열
}

// 파싱 에러 확인
if (doc.errors.length > 0) {
  for (const err of doc.errors) {
    console.error(`Line ${err.range.start.line}: ${err.message}`);
  }
}
```

---

## LintEngine

린트 엔진. 단일 파일과 프로젝트 전체를 검사한다.

### 생성

```typescript
const engine = new LintEngine();
```

### lint() — 단일 파일 린트

```typescript
lint(document: PlanDocument, options?: LintOptions): Diagnostic[];
```

**매개변수:**
| 이름 | 타입 | 설명 |
|------|------|------|
| `document` | `PlanDocument` | 파싱된 문서 |
| `options` | `LintOptions` (선택) | 린트 옵션 |

**LintOptions:**
```typescript
interface LintOptions {
  disabledRules?: string[];  // 비활성화할 규칙 ID 목록
  source?: string;           // 린트 지시자 파싱용 원시 소스
}
```

**사용 예:**

```typescript
import { parsePlanFile, LintEngine } from 'plan-lang';

const source = fs.readFileSync('my.plan', 'utf-8');
const doc = parsePlanFile(source, 'my.plan');

const engine = new LintEngine();

// 기본 린트
const diagnostics = engine.lint(doc, { source });

for (const d of diagnostics) {
  console.log(`[${d.ruleId}] ${d.severity} (line ${d.range.start.line}): ${d.message}`);
}

// 특정 규칙 비활성화
const filtered = engine.lint(doc, {
  source,
  disabledRules: ['PLAN-005', 'PLAN-006'],
});
```

### lintProject() — 프로젝트 전체 린트

```typescript
lintProject(
  documents: Map<string, PlanDocument>,
  sources?: Map<string, string>,
  options?: LintOptions,
): Map<string, Diagnostic[]>;
```

**매개변수:**
| 이름 | 타입 | 설명 |
|------|------|------|
| `documents` | `Map<string, PlanDocument>` | ID → 문서 맵 |
| `sources` | `Map<string, string>` (선택) | ID → 원시 소스 맵 |
| `options` | `LintOptions` (선택) | 린트 옵션 |

**반환값:** `Map<string, Diagnostic[]>` — ID별 진단 결과

교차 파일 규칙(PLAN-008, PLAN-009)이 포함된다.

**사용 예:**

```typescript
import { loadProject, LintEngine } from 'plan-lang';

const project = loadProject('./plans/');
const engine = new LintEngine();

const allDiags = engine.lintProject(project.documents, project.sources);

for (const [id, diags] of allDiags) {
  if (diags.length > 0) {
    console.log(`\n${id}:`);
    for (const d of diags) {
      console.log(`  [${d.ruleId}] ${d.severity}: ${d.message}`);
    }
  }
}
```

### getRules() — 등록된 규칙 목록

```typescript
getRules(): readonly LintRule[];
```

현재 등록된 모든 린트 규칙을 반환한다.

---

## loadProject()

디렉토리 내 모든 `.plan` 파일을 재귀적으로 찾아 파싱한다.

```typescript
function loadProject(dirPath: string): ProjectLoadResult;
```

**매개변수:**
| 이름 | 타입 | 설명 |
|------|------|------|
| `dirPath` | `string` | 프로젝트 디렉토리 경로 |

**반환값:**

```typescript
interface ProjectLoadResult {
  documents: Map<string, PlanDocument>;  // id → 파싱된 문서
  sources: Map<string, string>;          // id → 원시 소스
  errors: string[];                      // 파일 로드 에러 목록
}
```

맵의 키는 프론트매터의 `id` 필드다. `id`가 없으면 파일명(확장자 제외)이 키가 된다.

`node_modules/`와 `.git/` 디렉토리는 자동으로 제외된다.

**사용 예:**

```typescript
import { loadProject } from 'plan-lang';

const project = loadProject('./plans/');

console.log(`로드된 파일: ${project.documents.size}개`);

if (project.errors.length > 0) {
  console.error('로드 에러:', project.errors);
}

// 특정 문서 접근
const socialLogin = project.documents.get('feat-social-login');
console.log(socialLogin?.feature?.title);
```

---

## resolveReferences()

프로젝트 내 교차 파일 참조(`Needs:`, `Blocks:`)를 해석한다.

```typescript
function resolveReferences(
  documents: Map<string, PlanDocument>,
): { resolved: ResolvedReference[]; unresolved: UnresolvedReference[] };
```

**매개변수:**
| 이름 | 타입 | 설명 |
|------|------|------|
| `documents` | `Map<string, PlanDocument>` | 프로젝트 문서 맵 |

**반환 타입:**

```typescript
interface ResolvedReference {
  sourceId: string;          // 참조 원본 문서 ID
  targetId: string;          // 참조 대상 문서 ID
  targetDoc: PlanDocument;   // 참조 대상 문서
  line: DependencyLine;      // Needs/Blocks 라인
}

interface UnresolvedReference {
  sourceId: string;          // 참조 원본 문서 ID
  targetId: string;          // 참조 대상 ID (존재하지 않음)
  line: DependencyLine;      // Needs/Blocks 라인
}
```

`[external]`이나 `[doc:...]` 참조는 처리하지 않는다. `[plan-id]` 형태의 참조만 해석한다.

**사용 예:**

```typescript
import { loadProject, resolveReferences } from 'plan-lang';

const project = loadProject('./plans/');
const { resolved, unresolved } = resolveReferences(project.documents);

console.log(`해석 성공: ${resolved.length}개`);
console.log(`해석 실패: ${unresolved.length}개`);

for (const ref of unresolved) {
  console.warn(`${ref.sourceId} → [${ref.targetId}] 존재하지 않음`);
}
```

---

## collectUncertainty()

문서 내 불확실성 마커를 수집하여 요약한다.

```typescript
function collectUncertainty(doc: PlanDocument): UncertaintySummary;
```

**반환 타입:**

```typescript
interface UncertaintySummary {
  filePath: string;
  id: string;
  status: string;
  counts: Record<UncertaintyType, number>;  // 유형별 개수
  details: {
    type: UncertaintyType;
    message: string;
    line: number;
  }[];
}
```

**사용 예:**

```typescript
import { parsePlanFile, collectUncertainty } from 'plan-lang';

const source = fs.readFileSync('feat-payment.plan', 'utf-8');
const doc = parsePlanFile(source, 'feat-payment.plan');
const summary = collectUncertainty(doc);

console.log(`?pending: ${summary.counts.pending}개`);
console.log(`?assumption: ${summary.counts.assumption}개`);
console.log(`?alternative: ${summary.counts.alternative}개`);
console.log(`?risk: ${summary.counts.risk}개`);

// 상세 내역
for (const d of summary.details) {
  console.log(`  L${d.line}: ?${d.type} — ${d.message}`);
}
```

## formatUncertaintyReport()

불확실성 요약 배열을 사람이 읽을 수 있는 텍스트 리포트로 포맷한다.

```typescript
function formatUncertaintyReport(
  summaries: UncertaintySummary[],
  options?: { color?: boolean },
): string;
```

**사용 예:**

```typescript
import { loadProject, parsePlanFile, collectUncertainty, formatUncertaintyReport } from 'plan-lang';

const project = loadProject('./plans/');
const summaries = [];

for (const [id, doc] of project.documents) {
  summaries.push(collectUncertainty(doc));
}

const report = formatUncertaintyReport(summaries);
console.log(report);
```

---

## walkAST()

AST를 깊이 우선으로 순회하며 방문자 패턴으로 노드를 처리한다.

```typescript
function walkAST(doc: PlanDocument, visitor: ASTVisitor): void;
```

**ASTVisitor 인터페이스:**

```typescript
interface ASTVisitor {
  visitDocument?(doc: PlanDocument): void;
  visitFeature?(feature: FeatureBlock): void;
  visitStory?(story: StoryBlock): void;
  visitTask?(task: TaskBlock): void;
  visitEdge?(edge: EdgeBlock): void;
  visitUncertaintyBlock?(block: UncertaintyBlock): void;
}
```

모든 메서드는 선택적이다. 필요한 노드 타입만 구현하면 된다.

**순회 순서:** Document → Feature → (Feature의 UncertaintyBlock) → Story → (Story의 UncertaintyBlock) → Edge → Task → (Task의 UncertaintyBlock)

**사용 예:**

```typescript
import { parsePlanFile, walkAST } from 'plan-lang';
import type { ASTVisitor, TaskBlock, EdgeBlock } from 'plan-lang';

const doc = parsePlanFile(source);

// 모든 Task의 Assign을 수집
const assigns: string[] = [];

walkAST(doc, {
  visitTask(task: TaskBlock) {
    for (const a of task.assigns) {
      assigns.push(a.text);
    }
  },
});

console.log('담당자 목록:', assigns);
```

```typescript
// 모든 Edge 케이스를 수집
const edgeDescriptions: string[] = [];

walkAST(doc, {
  visitEdge(edge: EdgeBlock) {
    edgeDescriptions.push(edge.description);
  },
});

console.log('Edge 케이스:', edgeDescriptions);
```

---

## 핵심 타입 정의

### PlanDocument

최상위 문서 노드.

```typescript
interface PlanDocument {
  kind: 'document';
  filePath?: string;
  frontmatter: Frontmatter | null;
  feature: FeatureBlock | null;
  errors: ParseError[];
  comments: Range[];
}
```

### Frontmatter

YAML 프론트매터.

```typescript
interface Frontmatter {
  type: PlanType;           // 'feature' | 'story' | 'task'
  id: string;
  status: Status;           // 'draft' | 'ready' | 'in_progress' | 'blocked' | 'done' | 'deprecated'
  version?: string;
  owner?: string;
  priority?: Priority;      // 'urgent' | 'high' | 'normal' | 'low'
  tags?: string[];
  created?: string;
  updated?: string;
  [key: string]: unknown;   // 확장 필드 허용
}
```

### FeatureBlock

Feature 블록.

```typescript
interface FeatureBlock {
  kind: 'feature';
  title: string;
  intents: IntentLine[];           // Goal, Persona, Metric
  stories: StoryBlock[];
  dependencies: DependencyLine[];  // Needs, Blocks
  uncertaintyMarkers: UncertaintyMarker[];
  uncertaintyBlocks: UncertaintyBlock[];
  range: Range;
}
```

### StoryBlock

Story 블록.

```typescript
interface StoryBlock {
  kind: 'story';
  title: string;
  intents: IntentLine[];
  behaviors: BehaviorLine[];       // Given, When, Then
  edges: EdgeBlock[];
  tasks: TaskBlock[];
  dependencies: DependencyLine[];
  uncertaintyMarkers: UncertaintyMarker[];
  uncertaintyBlocks: UncertaintyBlock[];
  range: Range;
}
```

### TaskBlock

Task 블록.

```typescript
interface TaskBlock {
  kind: 'task';
  title: string;
  assigns: AssignLine[];
  verifies: VerifyLine[];
  dependencies: DependencyLine[];
  uncertaintyMarkers: UncertaintyMarker[];
  uncertaintyBlocks: UncertaintyBlock[];
  range: Range;
}
```

### EdgeBlock

Edge 블록.

```typescript
interface EdgeBlock {
  kind: 'edge';
  description: string;
  behaviors: BehaviorLine[];
  range: Range;
}
```

### UncertaintyMarker

인라인 불확실성 마커.

```typescript
interface UncertaintyMarker {
  kind: 'uncertainty-marker';
  type: UncertaintyType;    // 'pending' | 'assumption' | 'alternative' | 'risk'
  message: string;
  range: Range;
}
```

### UncertaintyBlock

블록 형태 불확실성.

```typescript
interface UncertaintyBlock {
  kind: 'uncertainty-block';
  type: UncertaintyType;
  message: string;
  children: (BehaviorLine | IntentLine | DependencyLine | TextLine)[];
  range: Range;
}
```

### Diagnostic

린트 진단 결과.

```typescript
interface Diagnostic {
  ruleId: string;       // 'PLAN-001' ~ 'PLAN-010'
  severity: Severity;   // 'error' | 'warning' | 'info'
  message: string;
  range: Range;
  filePath?: string;
}
```

### Range와 Location

위치 정보 (1-based).

```typescript
interface Location {
  line: number;    // 1-based
  column: number;  // 1-based
}

interface Range {
  start: Location;
  end: Location;
}
```

---

## 추가 내보내기 (inline parser 유틸리티)

저수준 파서 유틸리티도 내보내진다:

```typescript
import {
  scan,              // 소스 → RawLine[]
  classifyLine,      // 단일 줄 분류
  classifyLines,     // 여러 줄 분류
  parseFrontmatter,  // YAML 프론트매터 파싱
  parse,             // ClassifiedLine[] → PlanDocument

  // 인라인 파서
  parseUncertaintyMarkers,  // 텍스트에서 불확실성 마커 추출
  parseObligation,          // 텍스트에서 의무 수준 추출
  parseActorReferences,     // 텍스트에서 @참조 추출
  parseReferences,          // 텍스트에서 []참조 추출
} from 'plan-lang';
```

이 유틸리티들은 커스텀 도구를 만들 때 유용하다. 일반적인 사용에서는 `parsePlanFile()` 하나로 충분하다.
