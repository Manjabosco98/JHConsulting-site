// Minimal Chrome DevTools Protocol client. Node's global WebSocket is enough,
// so the browser tests add no dependency and no container.
export const CDP_URL = process.env.CDP_URL ?? "http://127.0.0.1:9222";

export async function connect() {
  const targets = await (await fetch(`${CDP_URL}/json/list`)).json();
  const page = targets.find((target) => target.type === "page");
  if (!page) throw new Error(`Nenhuma aba disponível em ${CDP_URL}. Suba um navegador headless com --remote-debugging-port=9222.`);

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", () => reject(new Error("Falha ao conectar no CDP.")), { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  const waiters = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result ?? {});
    } else if (message.method && waiters.has(message.method)) {
      const list = waiters.get(message.method);
      waiters.delete(message.method);
      list.forEach((resolve) => resolve(message.params));
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  const once = (method) =>
    new Promise((resolve) => waiters.set(method, [...(waiters.get(method) ?? []), resolve]));

  /** Runs an expression in the page and returns its value, awaiting promises. */
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? "erro na página");
    return result.value;
  };

  const goto = async (url) => {
    await send("Page.enable");
    const loaded = once("Page.loadEventFired");
    await send("Page.navigate", { url });
    await loaded;
  };

  /** Polls the page until `expression` returns something truthy. */
  const waitFor = async (expression, timeoutMs = 8000) => {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const value = await evaluate(expression);
      if (value) return value;
      if (Date.now() > deadline) return null;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  };

  return { send, once, evaluate, goto, waitFor, close: () => socket.close() };
}
