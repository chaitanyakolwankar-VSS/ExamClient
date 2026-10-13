// Live (/gradesphereapp/) and the demo (/ExamSoftware/) are served from one origin, so they share one
// localStorage. Every key is prefixed with this build's base path, so the two apps never read, overwrite
// or clear each other's sign-in, academic year or settings.
const PREFIX = `${import.meta.env.BASE_URL}:`;
const scoped = (key: string) => PREFIX + key;

export const appStorage = {
  get: (key: string) => localStorage.getItem(scoped(key)),
  set: (key: string, value: string) => localStorage.setItem(scoped(key), value),
  remove: (key: string) => localStorage.removeItem(scoped(key)),
  /** Removes this app's keys only. */
  clear: () => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX)) localStorage.removeItem(key);
    }
  },
};
