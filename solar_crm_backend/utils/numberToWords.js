/**
 * Converts numbers into Indian Currency Words (Rupees)
 * E.g., 250000 => "Two Lakh Fifty Thousand Rupees Only"
 */

const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

const convertTwoDigits = (n) => {
  if (n === 0) return "";
  if (n < 20) return ones[n] + " ";
  return tens[Math.floor(n / 10)] + " " + ones[n % 10] + (n % 10 !== 0 ? " " : "");
};

const convertThreeDigits = (n) => {
  let str = "";
  if (Math.floor(n / 100) > 0) {
    str += ones[Math.floor(n / 100)] + " Hundred ";
  }
  str += convertTwoDigits(n % 100);
  return str;
};

const numberToWords = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "Zero Rupees Only";
  
  const parsedNum = Math.round(Number(num));
  if (parsedNum === 0) return "Zero Rupees Only";
  if (parsedNum < 0) return "Minus " + numberToWords(Math.abs(parsedNum));

  let crores = Math.floor(parsedNum / 10000000);
  let remainder = parsedNum % 10000000;

  let lakhs = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  let thousands = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  let hundreds = remainder;

  let res = "";

  if (crores > 0) {
    res += convertTwoDigits(crores) + "Crore ";
  }
  if (lakhs > 0) {
    res += convertTwoDigits(lakhs) + "Lakh ";
  }
  if (thousands > 0) {
    res += convertTwoDigits(thousands) + "Thousand ";
  }
  if (hundreds > 0) {
    res += convertThreeDigits(hundreds);
  }

  return res.trim() + " Rupees Only";
};

module.exports = { numberToWords };
