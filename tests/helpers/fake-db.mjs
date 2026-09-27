/**
 * Chainable stand-in for the Supabase query builder. Every query is recorded as
 * a readable key ("table op op ...") and resolved through `respond(key, args)`.
 */
export function fakeDb(respond) {
  const log = [];
  const rpcCalls = [];
  const storageCalls = [];
  return {
    log,
    rpcCalls,
    storageCalls,
    storage: {
      from(bucket) {
        const call = async (op, ...args) => {
          storageCalls.push([op, bucket, ...args]);
          return respond(`storage ${op}`, args) ?? { data: null, error: null };
        };
        return {
          upload: (path, body, options) => call("upload", path, body, options),
          remove: (paths) => call("remove", paths),
          list: (folder, options) => call("list", folder, options)
        };
      }
    },
    async rpc(name, args) {
      rpcCalls.push([name, args]);
      return respond(`rpc ${name}`, args);
    },
    from(table) {
      const ops = [];
      const builder = {
        select(columns, options) { ops.push(options?.head ? "count" : `select(${columns})`); return builder; },
        delete() { ops.push("delete"); return builder; },
        update(values) { ops.push(`update(${JSON.stringify(values)})`); return builder; },
        insert(values) { ops.push(`insert(${JSON.stringify(values)})`); return builder; },
        eq(column, value) { ops.push(`${column}=${value}`); return builder; },
        is(column, value) { ops.push(`${column} is ${value}`); return builder; },
        not(column, operator, value) { ops.push(`${column} not ${operator} ${value}`); return builder; },
        ilike(column, pattern) { ops.push(`${column} ilike ${pattern}`); return builder; },
        order(column, options = {}) { ops.push(`order ${column} ${options.ascending === false ? "desc" : "asc"}`); return builder; },
        limit(n) { ops.push(`limit ${n}`); return builder; },
        maybeSingle() { ops.push("single"); return builder; },
        then(resolve, reject) {
          const key = [table, ...ops].join(" ");
          log.push(key);
          return Promise.resolve().then(() => respond(key)).then(resolve, reject);
        }
      };
      return builder;
    }
  };
}
