const sessions = new Map<string, { step: string; data: Record<string, any> }>();

export const getSession = (phone: string) => {
  if (!sessions.has(phone)) sessions.set(phone, { step: "MENU", data: {} });
  return sessions.get(phone)!;
};

export const setSession = (phone: string, step: string, data: Record<string, any> = {}) => {
  sessions.set(phone, { step, data });
};

export const clearSession = (phone: string) => {
  sessions.delete(phone);
};