// calcule le numéro de la semaine en cours
export const getCurrentWeek = (date) => {
  let currentdate = date;
  let oneJan = new Date(currentdate.getFullYear(), 0, 1);
  let numberOfDays = Math.floor((currentdate - oneJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((currentdate.getDay() + 1 + numberOfDays) / 7);
};
