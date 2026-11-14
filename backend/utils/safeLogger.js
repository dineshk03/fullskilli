const sensitive = /password|token|authorization|cookie|secret|captcha|otp|activation.?code|email|phone|contact|\bpid\b/i;

function sanitize(value, seen = new WeakSet()) {
    if (typeof value === 'string') return value.replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED]')
        .replace(/([?&](?:token|code|pid|email)=)[^&\s]*/gi, '$1[REDACTED]')
        .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[EMAIL]');
    if (!value || typeof value !== 'object') return value;
    if (value instanceof Error) return { name: value.name, message: sanitize(value.message) };
    if (Buffer.isBuffer(value)) return '[BINARY]';
    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);
    if (Array.isArray(value)) return value.map(item => sanitize(item, seen));
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sensitive.test(key) ? '[REDACTED]' : sanitize(item, seen)]));
}

function installSafeLogger() {
    for (const method of ['log', 'warn', 'error', 'info', 'debug']) {
        const original = console[method].bind(console);
        console[method] = (...args) => original(...args.map(value => sanitize(value)));
    }
}
module.exports = { sanitize, installSafeLogger };
