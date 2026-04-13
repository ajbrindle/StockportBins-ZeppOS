export const binColorMap = {
  'blue': 0x00FFFF,   // Cyan
  'green': 0x32CD32,  // Lime Green
  'brown': 0xFFA500,  // Orange/Brown
  'black': 0xFFFFFF   // White
}

export function formatBinDate(dateString, useShortMonth = false) {
  const date = new Date(dateString)
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  
  const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  
  const dayName = days[date.getDay()]
  const dayOfMonth = date.getDate()
  
  // Decide which month array to pull from
  const monthName = useShortMonth ? shortMonths[date.getMonth()] : fullMonths[date.getMonth()]
  
  let suffix = "th"
  if (dayOfMonth % 10 === 1 && dayOfMonth !== 11) suffix = "st"
  else if (dayOfMonth % 10 === 2 && dayOfMonth !== 12) suffix = "nd"
  else if (dayOfMonth % 10 === 3 && dayOfMonth !== 13) suffix = "rd"
  
  return `${dayName} ${dayOfMonth}${suffix} ${monthName}`
}