const crypto = require('node:crypto');

// The format used by course certificates: BA-YYAA0000.
function generateCertificateId(now = new Date()) {
  const year = String(now.getFullYear()).slice(-2);
  const letters = String.fromCharCode(
    65 + crypto.randomInt(26),
    65 + crypto.randomInt(26)
  );
  const numbers = String(crypto.randomInt(10000)).padStart(4, '0');
  return `BA-${year}${letters}${numbers}`;
}

async function reserveCertificateId(Certificate, reserved = new Set()) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const certificateId = generateCertificateId();
    if (reserved.has(certificateId)) continue;
    if (await Certificate.exists({ certificateId })) continue;
    reserved.add(certificateId);
    return certificateId;
  }
  throw new Error('Could not allocate a unique certificate ID');
}

module.exports = { generateCertificateId, reserveCertificateId };
