export const formatPhone = (value: string) => {
  const digitsOnly = value.replace(/[^\d]/g, "");
  let formatted = "+";

  if (!digitsOnly) return formatted; 

  const num = digitsOnly;

  const parts = [];
  if (num.length > 0) parts.push(num.slice(0, 3));
  if (num.length > 3) parts.push(num.slice(3, 5));
  if (num.length > 5) parts.push(num.slice(5, 8)); 
  if (num.length > 8) parts.push(num.slice(8, 10));
  if (num.length > 10) parts.push(num.slice(10, 12));

  formatted += parts.join(" ");

  return formatted;
};
