export const track = (eventName, params = {}) => {
    if (typeof gtag === 'undefined') return;
    const { hostname } = window.location;
    const isLocal = hostname === 'localhost' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.');
    if (isLocal) return;
    gtag('event', eventName, params);
};