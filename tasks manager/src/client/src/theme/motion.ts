import type { Transition } from 'motion/react'

/**
 * Springs (apple-design, section 4). Defaults are critically damped: no overshoot, graceful settle, never distracting.
 * Bounce is reserved for motion that started from a flick or a throw, because the gesture itself carried momentum.
 *
 * Springs have no fixed duration (they settle on their own); `duration` here is Motion's perceptual duration, the
 * counterpart of Apple's "response". All of them can be interrupted and re-targeted mid-flight.
 */
export const springs = {
  /** Move, reposition, layout changes: damping 1.0, response 0.4. */
  settle: { type: 'spring', bounce: 0, duration: 0.4 } satisfies Transition,
  /** Small, frequent changes such as a progress bar growing: damping 1.0, response 0.3. */
  snappy: { type: 'spring', bounce: 0, duration: 0.3 } satisfies Transition,
  /** Only after a flick or a drag release that carried velocity: slight overshoot. */
  flick: { type: 'spring', bounce: 0.2, duration: 0.4 } satisfies Transition,
}

/** Press feedback is immediate and lives on the press, not the release (section 1). */
export const press = { scale: 0.97 } as const
