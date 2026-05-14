import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, 'variables.css'), 'utf-8');

describe('CSS 변수 정의 완료 (FE-26)', () => {
  const requiredTokens = [
    '--color-primary-600',
    '--color-primary-500',
    '--color-primary-100',
    '--color-primary-50',
    '--color-gray-900',
    '--color-gray-700',
    '--color-gray-500',
    '--color-gray-300',
    '--color-gray-200',
    '--color-gray-100',
    '--color-gray-50',
    '--color-danger',
    '--color-danger-light',
    '--color-warning',
    '--color-warning-light',
    '--color-bg-base',
    '--color-bg-sidebar',
    '--color-bg-page',
    '--color-border',
    '--color-border-focus',
    '--font-sans',
    '--text-xs',
    '--text-sm',
    '--text-base',
    '--text-md',
    '--text-lg',
    '--text-xl',
    '--space-1',
    '--space-2',
    '--space-3',
    '--space-4',
    '--space-6',
    '--transition-fast',
    '--transition-base',
    '--radius-sm',
    '--radius-md',
    '--shadow-sm',
    '--shadow-md',
    '--z-header',
    '--z-modal',
    '--z-toast',
  ];

  requiredTokens.forEach((token) => {
    it(`${token} 가 정의되어 있다`, () => {
      expect(css).toContain(token);
    });
  });
});
