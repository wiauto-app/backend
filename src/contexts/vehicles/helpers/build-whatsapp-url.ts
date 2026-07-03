export const buildWhatsAppUrl = (
  phone_code: string,
  phone: string,
  message?: string,
): string => {
  const digits = `${phone_code}${phone}`.replace(/\D/g, "");
  const base_url = `https://wa.me/${digits}`;

  if (!message?.trim()) {
    return base_url;
  }

  return `${base_url}?text=${encodeURIComponent(message.trim())}`;
};
