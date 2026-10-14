/** Atributos para ligar un role="alert" al control que falló. */
export function fieldErr(id: string, on: boolean) {
  if (!on) return {};
  return { "aria-invalid": true as const, "aria-describedby": id };
}
