import { randomInt } from "node:crypto";

// Sin 0/O/1/l/I — se van a transcribir a mano al entregarlas, y esos pares
// son los que más se confunden.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";

/** Contraseña temporal generada con randomInt (CSPRNG) — para reset de
 * contraseña y alta de cuentas de portal, donde nadie elige el valor. */
export function generarPasswordTemporal(longitud = 12): string {
  let out = "";
  for (let i = 0; i < longitud; i++) {
    out += ALFABETO[randomInt(ALFABETO.length)];
  }
  return out;
}
