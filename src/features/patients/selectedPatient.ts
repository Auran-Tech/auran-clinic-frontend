const key = "auran.clinic.selected-patient";

export const selectedPatient = {
  get(): string | null {
    return sessionStorage.getItem(key);
  },
  set(patientId: string) {
    sessionStorage.setItem(key, patientId);
  },
  clear() {
    sessionStorage.removeItem(key);
  }
};
