// src/utils/ipBlocker.js

// Example: Replace with dynamic or persistent logic as needed
const blockedIPs = new Set([
    '123.456.789.000', // Replace with real IPs
    '192.168.1.100'
]);

/**
 * Checks if the given IP is in the blocked list.
 * @param {string} ip - The IP address to check.
 * @returns {boolean} True if the IP is blocked, otherwise false.
 */
function isIPBlocked(ip) {
    return blockedIPs.has(ip);
}

/**
 * Adds an IP to the blocked list.
 * @param {string} ip - The IP address to block.
 */
function blockIP(ip) {
    blockedIPs.add(ip);
}

/**
 * Removes an IP from the blocked list.
 * @param {string} ip - The IP address to unblock.
 */
function unblockIP(ip) {
    blockedIPs.delete(ip);
}

module.exports = {
    isIPBlocked,
    blockIP,
    unblockIP
};
