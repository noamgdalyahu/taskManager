import { tokens } from '@/theme/tokens'

/** A stable colour pair for any id: the same project or person is the same colour on every screen. */
export function toneFor(id: string) {
  let hash = 0
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return tokens.avatar[hash % tokens.avatar.length]
}
