// Armazena o token em memória para uso nos interceptors do axios.
// O AuthContext popula este store ao fazer login/logout.
let currentToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const tokenStore = {
  setToken: (token: string | null) => { currentToken = token; },
  getToken: () => currentToken,
  setOnUnauthorized: (cb: () => void) => { onUnauthorized = cb; },
  callUnauthorized: () => onUnauthorized?.(),
};
