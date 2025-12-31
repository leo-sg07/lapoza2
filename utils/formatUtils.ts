
export const formatCurrency = (value: number | string): string => {
  if (!value) return "0";
  const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) : value;
  return new Intl.NumberFormat('vi-VN').format(num);
};

export const parseCurrency = (value: string): number => {
  return parseInt(value.replace(/\D/g, '')) || 0;
};
