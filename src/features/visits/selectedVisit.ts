const key = "auran.clinic.selected-visit";

export const selectedVisit = {
  get(): string | null {
    return sessionStorage.getItem(key);
  },
  set(visitId: string) {
    sessionStorage.setItem(key, visitId);
  },
  clear() {
    sessionStorage.removeItem(key);
  }
};
