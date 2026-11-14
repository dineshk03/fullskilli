const dns = require('dns').promises;

/**
 * Comprehensive email validation utility
 * Validates email format and optionally checks DNS/MX records
 */

/**
 * Validate email format using RFC 5322 compliant regex
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if format is valid
 */
const isValidEmailFormat = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }

    // RFC 5322 compliant email regex (simplified but comprehensive)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    // Basic checks
    if (!emailRegex.test(email)) {
        return false;
    }

    // Additional validation rules
    const parts = email.split('@');
    if (parts.length !== 2) {
        return false;
    }

    const [localPart, domain] = parts;

    // Local part validation
    if (localPart.length === 0 || localPart.length > 64) {
        return false;
    }

    // Domain validation
    if (domain.length === 0 || domain.length > 255) {
        return false;
    }

    // Check for consecutive dots
    if (email.includes('..')) {
        return false;
    }

    // Check if domain has at least one dot
    if (!domain.includes('.')) {
        return false;
    }

    // Check for valid TLD (at least 2 characters)
    const tld = domain.split('.').pop();
    if (tld.length < 2) {
        return false;
    }

    return true;
};

/**
 * Check if domain has valid MX records (can receive emails)
 * @param {string} domain - Domain to check
 * @returns {Promise<boolean>} - True if domain has MX records
 */
const hasMXRecords = async (domain) => {
    try {
        const addresses = await dns.resolveMx(domain);
        return addresses && addresses.length > 0;
    } catch (error) {
        // If MX lookup fails, try A record as fallback
        try {
            await dns.resolve4(domain);
            return true; // Domain exists, might accept email
        } catch (aError) {
            return false;
        }
    }
};

/**
 * Comprehensive email validation
 * @param {string} email - Email address to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.checkDNS - Whether to check DNS/MX records (default: true)
 * @param {boolean} options.allowDisposable - Whether to allow disposable email domains (default: true)
 * @returns {Promise<Object>} - Validation result with details
 */
const validateEmail = async (email, options = {}) => {
    const { checkDNS = true, allowDisposable = true } = options;

    const result = {
        isValid: false,
        email: email,
        errors: [],
        warnings: []
    };

    // Step 1: Format validation
    if (!isValidEmailFormat(email)) {
        result.errors.push('Invalid email format');
        return result;
    }

    const domain = email.split('@')[1].toLowerCase();

    // Step 2: Common typo detection
    const commonDomainTypos = {
        'gmial.com': 'gmail.com',
        'gmai.com': 'gmail.com',
        'gmil.com': 'gmail.com',
        'yahooo.com': 'yahoo.com',
        'yaho.com': 'yahoo.com',
        'hotmial.com': 'hotmail.com',
        'outlok.com': 'outlook.com',
        'outloo.com': 'outlook.com'
    };

    if (commonDomainTypos[domain]) {
        result.errors.push(`Possible typo detected. Did you mean ${email.split('@')[0]}@${commonDomainTypos[domain]}?`);
        result.suggestedEmail = `${email.split('@')[0]}@${commonDomainTypos[domain]}`;
        return result;
    }

    // Step 3: Check for suspicious patterns (numbers in username that might be typos)
    const localPart = email.split('@')[0];
    const hasNumbersInMiddle = /[a-z]+\d+[a-z]+/i.test(localPart);
    if (hasNumbersInMiddle) {
        result.warnings.push('Email contains numbers in the middle of the username, which might be a typo');
    }

    // Step 4: DNS/MX record validation (if enabled)
    if (checkDNS) {
        try {
            const hasMX = await hasMXRecords(domain);
            if (!hasMX) {
                result.errors.push('Domain does not have valid MX records or does not exist');
                return result;
            }
        } catch (error) {
            result.warnings.push(`Unable to verify domain DNS records: ${error.message}`);
            // Don't fail validation if DNS check fails, just warn
        }
    }

    // Step 5: Disposable email detection (optional)
    if (!allowDisposable) {
        const disposableDomains = [
            'tempmail.com', 'throwaway.email', '10minutemail.com',
            'guerrillamail.com', 'mailinator.com', 'trashmail.com'
        ];

        if (disposableDomains.includes(domain)) {
            result.errors.push('Disposable email addresses are not allowed');
            return result;
        }
    }

    // All checks passed
    result.isValid = true;
    return result;
};

/**
 * Validate multiple emails in batch
 * @param {Array<string>} emails - Array of email addresses
 * @param {Object} options - Validation options
 * @returns {Promise<Array<Object>>} - Array of validation results
 */
const validateEmailBatch = async (emails, options = {}) => {
    const validationPromises = emails.map(email => validateEmail(email, options));
    return await Promise.all(validationPromises);
};

/**
 * Quick synchronous email format check (no DNS validation)
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if format is valid
 */
const isValidEmail = (email) => {
    return isValidEmailFormat(email);
};

module.exports = {
    validateEmail,
    validateEmailBatch,
    isValidEmail,
    isValidEmailFormat,
    hasMXRecords
};
