import { useEffect, useState, type Dispatch, type SetStateAction } from "react"

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

export function usePersistedState<T>(
  key: string,
  getInitial: () => T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return getInitial()
    try {
      const raw = window.localStorage.getItem(key)
      if (raw === null) return getInitial()
      const parsed: unknown = JSON.parse(raw)
      const init = getInitial()
      if (isPlainObject(init) && isPlainObject(parsed)) {
        return { ...init, ...parsed } as T
      }
      return parsed as T
    } catch {
      return getInitial()
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // Storage quota or private mode: drop silently
    }
  }, [key, state])

  return [state, setState]
}
