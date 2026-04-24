export const ENV = {
  BASE_URL:
    process.env.EXPO_PUBLIC_BASE_URL?.trim() ||
    //'https://cuisinedev.kernelencode.com',
    'https://cuisine.kernelencode.com',

  M2M_CLIENT_ID:
    process.env.EXPO_PUBLIC_M2M_CLIENT_ID?.trim() || '',

  M2M_CLIENT_SECRET:
    process.env.EXPO_PUBLIC_M2M_CLIENT_SECRET?.trim() || '',
    
};
// console.log('BASE_URL =', ENV.BASE_URL);
// console.log('M2M_CLIENT_ID =', ENV.M2M_CLIENT_ID);
// console.log('M2M_CLIENT_SECRET =', ENV.M2M_CLIENT_SECRET);