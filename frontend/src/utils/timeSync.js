/**
 * Calculate time remaining using server-synced time
 * @param {string|Date} auctionEndTime - Auction end time
 * @param {number} timeDrift - Time drift in milliseconds (serverTime - clientTime)
 * @returns {number} Time remaining in seconds
 */
export const calculateTimeRemaining = (auctionEndTime, timeDrift = 0) => {
  const now = Date.now() + timeDrift;
  const end = new Date(auctionEndTime).getTime();
  return Math.max(0, Math.floor((end - now) / 1000));
};

/**
 * Format seconds into readable time string (HH:MM:SS)
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export const formatTimeRemaining = (seconds) => {
  if (seconds <= 0) return '00:00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Check if auction has ended
 * @param {string|Date} auctionEndTime - Auction end time
 * @param {number} timeDrift - Time drift in milliseconds
 * @returns {boolean} True if auction has ended
 */
export const isAuctionEnded = (auctionEndTime, timeDrift = 0) => {
  const now = Date.now() + timeDrift;
  const end = new Date(auctionEndTime).getTime();
  return now >= end;
};
