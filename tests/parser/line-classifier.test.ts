import { describe, it, expect } from 'vitest';
import { classifyLine } from '../../src/parser/line-classifier.js';
import type { RawLine } from '../../src/types/ast.js';

function raw(lineNumber: number, text: string): RawLine {
  return { lineNumber, text };
}

describe('Line Classifier', () => {
  it('classifies feature heading', () => {
    const result = classifyLine(raw(1, '# Feature: 소셜 로그인'));
    expect(result.type).toBe('feature-heading');
    expect(result.headingTitle).toBe('소셜 로그인');
  });

  it('classifies story heading', () => {
    const result = classifyLine(raw(5, '## Story: Google 계정으로 가입'));
    expect(result.type).toBe('story-heading');
    expect(result.headingTitle).toBe('Google 계정으로 가입');
  });

  it('classifies task heading', () => {
    const result = classifyLine(raw(10, '### Task: OAuth 콜백 핸들러 구현'));
    expect(result.type).toBe('task-heading');
    expect(result.headingTitle).toBe('OAuth 콜백 핸들러 구현');
  });

  it('classifies intent keywords', () => {
    expect(classifyLine(raw(1, 'Goal: 목표입니다')).type).toBe('intent');
    expect(classifyLine(raw(1, 'Goal: 목표입니다')).keyword).toBe('Goal');
    expect(classifyLine(raw(1, 'Persona: @user')).keyword).toBe('Persona');
    expect(classifyLine(raw(1, 'Metric: value > 40%')).keyword).toBe('Metric');
  });

  it('classifies behavior keywords', () => {
    expect(classifyLine(raw(1, 'Given: 전제조건')).keyword).toBe('Given');
    expect(classifyLine(raw(1, 'When: 동작')).keyword).toBe('When');
    expect(classifyLine(raw(1, 'Then: 결과')).keyword).toBe('Then');
    expect(classifyLine(raw(1, 'When: 동작')).type).toBe('behavior');
  });

  it('classifies dependency keywords', () => {
    expect(classifyLine(raw(1, 'Needs: [feat-auth] 인증')).keyword).toBe('Needs');
    expect(classifyLine(raw(1, 'Blocks: [feat-x] 기능')).keyword).toBe('Blocks');
    expect(classifyLine(raw(1, 'Needs: [feat-auth]')).type).toBe('dependency');
  });

  it('classifies task keywords', () => {
    expect(classifyLine(raw(1, 'Assign: @backend-agent')).keyword).toBe('Assign');
    expect(classifyLine(raw(1, 'Verify: tests pass')).keyword).toBe('Verify');
    expect(classifyLine(raw(1, 'Assign: @agent')).type).toBe('task-keyword');
  });

  it('classifies edge keyword', () => {
    const result = classifyLine(raw(1, 'Edge: "이메일이 없는 경우"'));
    expect(result.type).toBe('edge');
    expect(result.keyword).toBe('Edge');
  });

  it('classifies uncertainty open/close', () => {
    const open = classifyLine(raw(1, '?pending "결제 수단 확인 필요"'));
    expect(open.type).toBe('uncertainty-open');
    expect(open.keyword).toBe('pending');
    expect(open.value).toBe('결제 수단 확인 필요');

    const close = classifyLine(raw(5, '?end'));
    expect(close.type).toBe('uncertainty-close');
  });

  it('classifies separator', () => {
    expect(classifyLine(raw(1, '---')).type).toBe('separator');
  });

  it('classifies comments', () => {
    expect(classifyLine(raw(1, '<!-- comment -->')).type).toBe('comment-full');
    expect(classifyLine(raw(1, '<!-- start')).type).toBe('comment-open');
    expect(classifyLine(raw(1, '  end -->')).type).toBe('comment-close');
  });

  it('classifies blank lines', () => {
    expect(classifyLine(raw(1, '')).type).toBe('blank');
    expect(classifyLine(raw(1, '   ')).type).toBe('blank');
  });

  it('classifies plain text', () => {
    expect(classifyLine(raw(1, 'some random text')).type).toBe('text');
  });

  it('handles indented keywords', () => {
    const result = classifyLine(raw(1, '  When: indented behavior'));
    expect(result.type).toBe('behavior');
    expect(result.keyword).toBe('When');
    expect(result.indent).toBe(2);
  });
});
