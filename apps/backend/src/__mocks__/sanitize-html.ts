const sanitizeHtml = (html: string, _options?: any): string => {
  if (typeof html !== 'string') return '';
  // Basic mock removing script tags for test environment
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export default sanitizeHtml;
