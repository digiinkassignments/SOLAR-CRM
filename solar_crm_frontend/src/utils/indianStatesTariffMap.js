export const INDIAN_STATES_TARIFF_MAP = [
  { state: "Andaman and Nicobar Islands", tariff: 7.50, sunHours: 5.2 },
  { state: "Andhra Pradesh", tariff: 7.80, sunHours: 5.6 },
  { state: "Arunachal Pradesh", tariff: 6.50, sunHours: 4.8 },
  { state: "Assam", tariff: 7.20, sunHours: 4.8 },
  { state: "Bihar", tariff: 7.50, sunHours: 5.2 },
  { state: "Chandigarh", tariff: 5.50, sunHours: 5.4 },
  { state: "Chhattisgarh", tariff: 6.80, sunHours: 5.5 },
  { state: "Dadra and Nagar Haveli and Daman and Diu", tariff: 5.00, sunHours: 5.6 },
  { state: "Delhi", tariff: 7.00, sunHours: 5.4 },
  { state: "Goa", tariff: 5.20, sunHours: 5.5 },
  { state: "Gujarat", tariff: 7.20, sunHours: 5.8 },
  { state: "Haryana", tariff: 7.00, sunHours: 5.4 },
  { state: "Himachal Pradesh", tariff: 5.80, sunHours: 5.0 },
  { state: "Jammu and Kashmir", tariff: 5.50, sunHours: 5.0 },
  { state: "Jharkhand", tariff: 6.80, sunHours: 5.3 },
  { state: "Karnataka", tariff: 8.50, sunHours: 5.6 },
  { state: "Kerala", tariff: 7.50, sunHours: 5.3 },
  { state: "Ladakh", tariff: 5.50, sunHours: 5.2 },
  { state: "Lakshadweep", tariff: 7.00, sunHours: 5.4 },
  { state: "Madhya Pradesh", tariff: 7.80, sunHours: 5.7 },
  { state: "Maharashtra", tariff: 9.50, sunHours: 5.6 },
  { state: "Manipur", tariff: 6.50, sunHours: 4.8 },
  { state: "Meghalaya", tariff: 6.80, sunHours: 4.7 },
  { state: "Mizoram", tariff: 6.50, sunHours: 4.8 },
  { state: "Nagaland", tariff: 6.80, sunHours: 4.8 },
  { state: "Odisha", tariff: 6.20, sunHours: 5.3 },
  { state: "Puducherry", tariff: 6.00, sunHours: 5.5 },
  { state: "Punjab", tariff: 7.50, sunHours: 5.4 },
  { state: "Rajasthan", tariff: 8.00, sunHours: 5.8 },
  { state: "Sikkim", tariff: 5.50, sunHours: 4.7 },
  { state: "Tamil Nadu", tariff: 8.20, sunHours: 5.6 },
  { state: "Telangana", tariff: 8.00, sunHours: 5.6 },
  { state: "Tripura", tariff: 6.80, sunHours: 4.8 },
  { state: "Uttar Pradesh", tariff: 7.50, sunHours: 5.3 },
  { state: "Uttarakhand", tariff: 6.20, sunHours: 5.1 },
  { state: "West Bengal", tariff: 8.80, sunHours: 5.1 }
];

export const getTariffForState = (stateName) => {
  if (!stateName) return 8.00;
  const found = INDIAN_STATES_TARIFF_MAP.find(
    (item) => item.state.toLowerCase() === stateName.trim().toLowerCase()
  );
  return found ? found.tariff : 8.00;
};

export const getSunHoursForState = (stateName) => {
  if (!stateName) return 5.5;
  const found = INDIAN_STATES_TARIFF_MAP.find(
    (item) => item.state.toLowerCase() === stateName.trim().toLowerCase()
  );
  return found ? found.sunHours : 5.5;
};
