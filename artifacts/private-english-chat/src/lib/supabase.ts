const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
type Result<T = unknown> = { data: T; error: { message: string } | null };

class Query {
  private table: string;
  private method = 'GET';
  private body: unknown;
  private filters: string[] = [];
  private wantsRows = false;
  private one = false;
  private orderBy = '';
  constructor(table: string) { this.table = table; }
  select(columns = '*') { this.wantsRows = true; this.filters.push(`select=${encodeURIComponent(columns)}`); return this; }
  eq(column: string, value: string) { this.filters.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`); return this; }
  neq(column: string, value: string) { this.filters.push(`${encodeURIComponent(column)}=not.eq.${encodeURIComponent(value)}`); return this; }
  order(column: string, options?: { ascending?: boolean }) { this.orderBy = `order=${encodeURIComponent(column)}.${options?.ascending === false ? 'desc' : 'asc'}`; return this; }
  insert(value: unknown) { this.method = 'POST'; this.body = value; return this; }
  update(value: unknown) { this.method = 'PATCH'; this.body = value; return this; }
  delete() { this.method = 'DELETE'; return this; }
  single() { this.one = true; return this.execute().then((result) => ({ ...result, data: Array.isArray(result.data) ? result.data[0] : result.data })); }
  maybeSingle() { this.one = true; return this.execute().then((result) => ({ ...result, data: Array.isArray(result.data) ? result.data[0] || null : result.data })); }
  then<TResult1 = Result, TResult2 = never>(onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null) {
    return this.execute().then(onfulfilled, onrejected);
  }
  private async execute(): Promise<Result> {
    if (!supabaseUrl || !supabaseAnonKey) return { data: [], error: { message: 'Supabase environment variables are not configured.' } };
    const params = [...this.filters, this.orderBy].filter(Boolean).join('&');
    const url = `${supabaseUrl}/rest/v1/${this.table}${params ? `?${params}` : ''}`;
    try {
      const response = await fetch(url, { method: this.method, headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}`, 'Content-Type': 'application/json', Prefer: this.wantsRows || this.one ? 'return=representation' : 'return=minimal' }, body: this.method === 'GET' || this.method === 'DELETE' && !this.body ? undefined : JSON.stringify(this.body) });
      const data = response.status === 204 ? [] : await response.json();
      return response.ok ? { data, error: null } : { data: [], error: { message: data?.message || 'Supabase request failed.' } };
    } catch { return { data: [], error: { message: 'تعذر الاتصال بالخادم.' } }; }
  }
}

export const supabase = {
  from: (table: string) => new Query(table),
  channel: (_name: string) => {
    const channel = {
      on: (_event: string, _config: unknown, _callback: unknown) => channel,
      subscribe: () => channel,
    };
    return channel;
  },
  removeChannel: (_channel: unknown) => undefined,
};