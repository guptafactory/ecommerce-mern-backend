export const calculatePercent = (
  currMonth: number,
  prevMonth: number
): number => {
  if (prevMonth === 0) return Number((currMonth * 100).toFixed(0));

  const percent = ((currMonth - prevMonth) / prevMonth) * 100;
  return Number(percent.toFixed(0));
};
