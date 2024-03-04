export function formatTime(time: Record<string, number>) {
  return (
    Object.entries(time)
      .filter((e) => e[1])
      .map((e) => [
        e[0].slice(0, -1).padEnd(e[1] > 1 ? e[0].length : 0, 's'),
        e[1],
      ])
      .map((e, i, a) =>
        i === a.length - 1 && a.length > 1
          ? `and ${e[1]} ${e[0]}`
          : i === a.length - 2 || a.length === 1
          ? `${e[1]} ${e[0]}`
          : `${e[1]} ${e[0]},`,
      )
      .join(' ') || '0 seconds'
  )
}
