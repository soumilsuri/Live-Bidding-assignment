/**
 * Get current server timestamp
 * @returns {Number} Current timestamp in milliseconds
 */
export const getServerTime = () => {
    return Date.now();
};

/**
 * Get current server date
 * @returns {Date} Current date object
 */
export const getServerDate = () => {
    return new Date();
};

/**
 * Calculate time remaining until auction ends
 * @param {Date} auctionEndTime - Auction end time
 * @returns {Number} Seconds remaining (0 if ended)
 */
export const calculateTimeRemaining = (auctionEndTime) => {
    const now = getServerTime();
    const endTime = new Date(auctionEndTime).getTime();
    const diff = endTime - now;

    // Return 0 if auction has ended
    return diff > 0 ? Math.floor(diff / 1000) : 0;
};

/**
 * Check if auction has ended
 * @param {Date} auctionEndTime - Auction end time
 * @returns {Boolean} True if auction has ended
 */
export const isAuctionEnded = (auctionEndTime) => {
    return new Date(auctionEndTime).getTime() <= getServerTime();
};

/**
 * Validate auction end time
 * @param {Date} auctionEndTime - Auction end time to validate
 * @returns {Boolean} True if valid (future time)
 */
export const isValidAuctionEndTime = (auctionEndTime) => {
    return new Date(auctionEndTime).getTime() > getServerTime();
};
