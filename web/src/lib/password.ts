import { randomInt } from "node:crypto";

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";

export function generarPasswordTemporal(longitud = 12): string {
  let out = "";
  for (let i = 0; i < longitud; i++) {
    out += ALFABETO[randomInt(ALFABETO.length)];
  }
  return out;
}
