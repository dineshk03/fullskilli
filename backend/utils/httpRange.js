function parseRange(header, size) {
    if (!header) return null;
    const match = /^bytes=(\d*)-(\d*)$/.exec(header);
    if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(size) || size <= 0) throw new RangeError('Invalid range');
    const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    let end = match[1] && match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start || (!match[1] && Number(match[2]) === 0)) throw new RangeError('Unsatisfiable range');
    end = Math.min(end, size - 1);
    return { start, end };
}
module.exports = { parseRange };
