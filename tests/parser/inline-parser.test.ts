import { describe, it, expect } from 'vitest';
import {
  parseUncertaintyMarkers,
  parseObligation,
  parseActorReferences,
  parseReferences,
} from '../../src/parser/inline-parser.js';

describe('Inline Parser', () => {
  describe('parseUncertaintyMarkers', () => {
    it('parses ?pending("message")', () => {
      const markers = parseUncertaintyMarkers(
        'PG사를 통해 결제 ?pending("PG사 선정 미완료")',
        10,
      );
      expect(markers).toHaveLength(1);
      expect(markers[0].type).toBe('pending');
      expect(markers[0].message).toBe('PG사 선정 미완료');
    });

    it('parses ?assumption("message")', () => {
      const markers = parseUncertaintyMarkers(
        'value > 95% ?assumption("업계 평균 기반 가정")',
        5,
      );
      expect(markers).toHaveLength(1);
      expect(markers[0].type).toBe('assumption');
    });

    it('parses multiple markers', () => {
      const markers = parseUncertaintyMarkers(
        'text ?pending("a") more ?risk("b")',
        1,
      );
      expect(markers).toHaveLength(2);
      expect(markers[0].type).toBe('pending');
      expect(markers[1].type).toBe('risk');
    });

    it('returns empty for no markers', () => {
      expect(parseUncertaintyMarkers('plain text', 1)).toHaveLength(0);
    });
  });

  describe('parseObligation', () => {
    it('parses [MUST]', () => {
      const obl = parseObligation('홈 화면으로 이동 [MUST]', 1);
      expect(obl).toBeDefined();
      expect(obl!.level).toBe('MUST');
    });

    it('parses [SHOULD]', () => {
      const obl = parseObligation('권장사항 [SHOULD]', 1);
      expect(obl!.level).toBe('SHOULD');
    });

    it('parses [MAY]', () => {
      const obl = parseObligation('선택사항 [MAY]', 1);
      expect(obl!.level).toBe('MAY');
    });

    it('returns undefined when no obligation', () => {
      expect(parseObligation('no obligation here', 1)).toBeUndefined();
    });
  });

  describe('parseActorReferences', () => {
    it('parses @name references', () => {
      const refs = parseActorReferences('@new_user가 화면에 도달', 1);
      expect(refs).toHaveLength(1);
      expect(refs[0].name).toBe('new_user');
    });

    it('parses multiple actor references', () => {
      const refs = parseActorReferences('@admin과 @user가 협업', 1);
      expect(refs).toHaveLength(2);
    });
  });

  describe('parseReferences', () => {
    it('parses [id] plan reference', () => {
      const refs = parseReferences('[feat-social-login] 소셜 로그인', 1);
      expect(refs).toHaveLength(1);
      expect(refs[0].kind).toBe('plan-reference');
      if (refs[0].kind === 'plan-reference') {
        expect(refs[0].id).toBe('feat-social-login');
      }
    });

    it('parses [id#fragment] reference', () => {
      const refs = parseReferences('[feat-auth#story-google]', 1);
      expect(refs).toHaveLength(1);
      if (refs[0].kind === 'plan-reference') {
        expect(refs[0].id).toBe('feat-auth');
        expect(refs[0].fragment).toBe('story-google');
      }
    });

    it('parses [external] reference', () => {
      const refs = parseReferences('[external] Google OAuth', 1);
      expect(refs).toHaveLength(1);
      expect(refs[0].kind).toBe('external-reference');
    });

    it('parses [doc:id] reference', () => {
      const refs = parseReferences('[doc:api-design] 참조', 1);
      expect(refs).toHaveLength(1);
      if (refs[0].kind === 'doc-reference') {
        expect(refs[0].id).toBe('api-design');
      }
    });

    it('skips obligation markers', () => {
      const refs = parseReferences('text [MUST] more [SHOULD]', 1);
      expect(refs).toHaveLength(0);
    });
  });
});
