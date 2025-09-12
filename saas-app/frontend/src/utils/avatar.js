// Utility function to get avatar URL (DiceBear or custom)
export const getAvatarUrl = (email, customAvatarUrl = null, size = 80) => {
  // If a custom avatar URL is provided, use it
  if (customAvatarUrl && customAvatarUrl.trim()) {
    return customAvatarUrl;
  }

  // Otherwise, generate DiceBear pixel-art URL
  // Use email as seed for consistency
  const seed = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  // Return DiceBear pixel-art URL with specified size
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}&size=${size}`;
};

// MD5 implementation using Web Crypto API when available, fallback to simple hash
function md5(str) {
  // If Web Crypto API is available, use it for proper MD5
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // For simplicity, we'll use a basic hash since MD5 isn't directly available in Web Crypto
    // In production, you'd use crypto-js library
    return simpleHash(str);
  }

  return simpleHash(str);
}

// Simple but consistent hash function for demo purposes
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to positive hex string
  let hex = (hash >>> 0).toString(16);
  while (hex.length < 8) {
    hex = '0' + hex;
  }

  return hex;
}