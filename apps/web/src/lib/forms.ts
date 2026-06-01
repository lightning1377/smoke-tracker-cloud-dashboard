export function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function numberValue(formData: FormData, key: string) {
  return Number(formData.get(key) ?? 0);
}
