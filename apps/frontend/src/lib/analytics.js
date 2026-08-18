export const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

export const setAnalyticsUser = (userId) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-1SNX3LEB5R', { user_id: userId });
  }
};
