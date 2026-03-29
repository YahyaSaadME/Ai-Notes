export const TNGIS_BASE = 'https://tngis.tn.gov.in';

// Use the same headers as in the notebook. Cookie can be provided via env to avoid hard-coding.
export function getTngisHeaders() {
  const cookie = process.env.TNGIS_COOKIE || '';
  const headers: Record<string, string> = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,ur;q=0.7',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Host': 'tngis.tn.gov.in',
    'Pragma': 'no-cache',
    'Referer': 'https://tngis.tn.gov.in/apps/gi_viewer/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
    'X-APP-NAME': 'demo',
    'X-Requested-With': 'XMLHttpRequest',
    'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
  };
  if (cookie) headers['Cookie'] = cookie;
  return headers;
}

export async function tngisFetch(path: string) {
  const url = `${TNGIS_BASE}${path}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getTngisHeaders(),
    // Avoid caching on our side as well
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Response(JSON.stringify({ error: 'Upstream TNGIS error', status: res.status, body: text }), { status: 502 });
  }
  try {
    return await res.json();
  } catch {
    const text = await res.text();
    throw new Response(JSON.stringify({ error: 'Invalid JSON from TNGIS', body: text }), { status: 502 });
  }
}
