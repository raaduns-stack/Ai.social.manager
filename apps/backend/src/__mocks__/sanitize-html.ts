const sanitizeHtml = (html: string, _options?: any): string => {
  if (typeof html !== 'string') return '';
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export default sanitizeHtml;
