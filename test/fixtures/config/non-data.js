const cycle = {}
cycle.self = cycle

export default [
  cycle,
  { x: null },
  { x: Infinity },
  { x: new Date(0) },
  { x: Array(1) }
]
