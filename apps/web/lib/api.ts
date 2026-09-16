const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000/api/v1';
};

export async function fetchApi<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('svcm_access_token')
      : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = getApiBaseUrl();
  const url = path.startsWith('http')
    ? path
    : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    let errorData: any = {};
    try {
      errorData = await res.json();
    } catch {
      errorData = { message: res.statusText };
    }

    const message =
      errorData?.error?.message ||
      errorData?.message ||
      'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
    const code = errorData?.error?.code || errorData?.statusCode || 'ERROR';

    const err = new Error(message) as any;
    err.code = code;
    err.status = res.status;
    err.details = errorData;
    throw err;
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}
