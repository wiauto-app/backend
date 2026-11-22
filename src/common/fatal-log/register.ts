/**
 * Import de efecto secundario: debe ser el PRIMER import de `main.ts` y
 * `worker.ts` para capturar también errores al cargar módulos (p. ej. `envs`).
 */
import { installFatalErrorHandlers } from "./fatal-log";

installFatalErrorHandlers();
