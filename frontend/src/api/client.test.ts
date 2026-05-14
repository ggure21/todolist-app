import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import { api, ApiError } from './client';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockLocationHref = vi.fn();
Object.defineProperty(window, 'location', {
  value: { get href() { return '/'; }, set href(v: string) { mockLocationHref(v); } },
  writable: true,
});

function makeResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, userId: null });
  mockFetch.mockReset();
  mockLocationHref.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('ApiError', () => {
  it('statusCode, message, code를 올바르게 저장한다', () => {
    const err = new ApiError(404, '찾을 수 없습니다', 'NOT_FOUND');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('찾을 수 없습니다');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.name).toBe('ApiError');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('api.get', () => {
  it('성공 응답을 파싱해서 반환한다', async () => {
    const data = { id: '1', title: '테스트' };
    mockFetch.mockResolvedValueOnce(makeResponse(200, data));

    const result = await api.get('/api/todos');
    expect(result).toEqual(data);
  });

  it('인증 토큰이 없으면 Authorization 헤더를 포함하지 않는다', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));

    await api.get('/api/todos');

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
  });

  it('accessToken이 있으면 Authorization: Bearer 헤더를 포함한다', async () => {
    useAuthStore.setState({ accessToken: 'test-token', userId: 'user-1' });
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));

    await api.get('/api/todos');

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer test-token');
  });

  it('올바른 URL로 요청한다', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));

    await api.get('/api/categories');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('/api/categories');
  });
});

describe('api.post', () => {
  it('POST 메서드로 JSON body를 전송한다', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(201, { id: 'new-id' }));

    await api.post('/api/todos', { title: '새 할일', categoryId: 'cat-1' });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ title: '새 할일', categoryId: 'cat-1' }));
  });
});

describe('api.patch', () => {
  it('PATCH 메서드로 요청한다', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));

    await api.patch('/api/todos/1', { title: '수정된 제목' });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('PATCH');
  });
});

describe('api.delete', () => {
  it('DELETE 메서드로 요청한다', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));

    await api.delete('/api/todos/1');

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('DELETE');
  });
});

describe('에러 처리', () => {
  it('401 응답 시 authStore.clearAuth()를 호출하고 /login으로 리다이렉트한다', async () => {
    useAuthStore.setState({ accessToken: 'expired-token', userId: 'user-1' });
    mockFetch.mockResolvedValueOnce(makeResponse(401, { message: '인증 만료', code: 'UNAUTHORIZED' }));

    await expect(api.get('/api/todos')).rejects.toThrow(ApiError);

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(mockLocationHref).toHaveBeenCalledWith('/login');
  });

  it('400 응답 시 ApiError를 throw한다', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(400, { message: '잘못된 요청', code: 'VALIDATION_ERROR' }));

    await expect(api.post('/api/todos', {})).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('500 응답 시 ApiError를 throw한다', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(500, { message: '서버 오류', code: 'INTERNAL_ERROR' }));

    await expect(api.get('/api/todos')).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it('403 응답 시 ApiError(403, FORBIDDEN)를 throw한다', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(403, { message: '접근 권한이 없습니다', code: 'FORBIDDEN' }));

    await expect(api.get('/api/todos/other-user')).rejects.toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });

  it('5xx 응답 시 ApiError를 throw하며 서버 오류 메시지를 포함한다', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(500, { message: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));

    await expect(api.get('/api/todos')).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it('응답 body 파싱 실패 시 기본 에러 메시지를 사용한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.reject(new Error('parse error')),
    });

    await expect(api.get('/api/todos')).rejects.toMatchObject({
      statusCode: 400,
      code: 'UNKNOWN',
    });
  });
});
