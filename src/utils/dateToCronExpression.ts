export function dateToCronExpression(date: Date) {
  const cronDate = new Date(date)

  const minute = cronDate.getMinutes()
  const hour = cronDate.getHours()
  const dayOfMonth = cronDate.getDate()
  const month = cronDate.getMonth() + 1 // Meses são baseados em zero (janeiro é 0)
  const dayOfWeek = cronDate.getDay()

  return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`
}
