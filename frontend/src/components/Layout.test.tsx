import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import { Layout } from './Layout';

vi.mock('./Header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

describe('Layout', () => {
  it('Header를 렌더링한다', () => {
    renderWithProviders(<Layout>콘텐츠</Layout>);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('children을 렌더링한다', () => {
    renderWithProviders(<Layout>메인 콘텐츠</Layout>);
    expect(screen.getByText('메인 콘텐츠')).toBeInTheDocument();
  });

  it('sidebar가 있으면 aside를 렌더링한다', () => {
    renderWithProviders(
      <Layout sidebar={<div>사이드바 내용</div>}>콘텐츠</Layout>,
    );
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByText('사이드바 내용')).toBeInTheDocument();
  });

  it('sidebar가 없으면 aside를 렌더링하지 않는다', () => {
    renderWithProviders(<Layout>콘텐츠</Layout>);
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('main 요소를 렌더링한다', () => {
    renderWithProviders(<Layout>콘텐츠</Layout>);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('sidebar의 aria-label이 "사이드바"이다', () => {
    renderWithProviders(
      <Layout sidebar={<div>사이드바</div>}>콘텐츠</Layout>,
    );
    expect(screen.getByLabelText('사이드바')).toBeInTheDocument();
  });

  describe('반응형 레이아웃 (FE-26)', () => {
    it('사이드바 aside에 hidden 클래스가 적용된다 (Mobile <768px 숨김)', () => {
      renderWithProviders(
        <Layout sidebar={<div>사이드바</div>}>콘텐츠</Layout>,
      );
      const aside = screen.getByRole('complementary');
      expect(aside.className).toContain('hidden');
    });

    it('사이드바 aside에 md:block 클래스가 적용된다 (Desktop ≥768px 표시)', () => {
      renderWithProviders(
        <Layout sidebar={<div>사이드바</div>}>콘텐츠</Layout>,
      );
      const aside = screen.getByRole('complementary');
      expect(aside.className).toContain('md:block');
    });

    it('사이드바 너비가 220px로 고정된다', () => {
      renderWithProviders(
        <Layout sidebar={<div>사이드바</div>}>콘텐츠</Layout>,
      );
      const aside = screen.getByRole('complementary');
      expect(aside.className).toContain('w-[286px]');
    });

    it('main에 flex-1 클래스가 적용된다 (모바일 전체 폭)', () => {
      renderWithProviders(<Layout>콘텐츠</Layout>);
      const main = screen.getByRole('main');
      expect(main.className).toContain('flex-1');
    });

    it('sidebar 없을 때 main이 전체 너비를 차지한다', () => {
      renderWithProviders(<Layout>콘텐츠</Layout>);
      expect(screen.queryByRole('complementary')).toBeNull();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});
