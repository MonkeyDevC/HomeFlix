import { sileo } from "sileo";

const duration = {
  success: 4000,
  info: 5000,
  warning: 6500,
  error: 9000
} as const;

/**
 * Mensajes transitorios de sistema (toasts Sileo).
 * Mantener copys en español; el UI inline (formularios, bloques de error) sigue siendo la fuente de verdad accesible.
 */
export const systemMessage = {
  success(title: string, description?: string) {
    return sileo.success({
      title,
      ...(description !== undefined ? { description } : {}),
      duration: duration.success
    });
  },

  info(title: string, description?: string) {
    return sileo.info({
      title,
      ...(description !== undefined ? { description } : {}),
      duration: duration.info
    });
  },

  warning(title: string, description?: string) {
    return sileo.warning({
      title,
      ...(description !== undefined ? { description } : {}),
      duration: duration.warning
    });
  },

  error(title: string, description?: string) {
    return sileo.error({
      title,
      ...(description !== undefined ? { description } : {}),
      duration: duration.error
    });
  }
};
