import { useState } from 'react';
import { useAuction } from '../../hooks/useAuction';
import useAuth from '../../hooks/useAuth';
import CountdownTimer from './CountdownTimer';
import StatusBadge from './StatusBadge';
import BidButton from './BidButton';
import BidInput from './BidInput';

const AuctionCard = ({ item }) => {
  const { isAuthenticated, user } = useAuth();
  const {
    currentBid,
    isBidding,
    bidError,
    flashColor,
    isWinning,
    handlePlaceBid,
    handleQuickBid,
  } = useAuction(item._id, item.currentBid, item.highestBidderId?._id);

  const [showCustomBid, setShowCustomBid] = useState(false);
  const isEnded = item.itemStatus === 'ENDED';
  const canBid = isAuthenticated && !isEnded;

  // Determine status for badge
  const getStatus = () => {
    if (isEnded) {
      const winnerId = item.winnerId?._id || item.winnerId;
      const userId = user?._id;
      return winnerId && userId && String(winnerId) === String(userId) ? 'WON' : 'LOST';
    }
    return isWinning ? 'WINNING' : 'OUTBID';
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
        flashColor === 'green'
          ? 'ring-4 ring-green-400 ring-opacity-50'
          : flashColor === 'red'
          ? 'ring-4 ring-red-400 ring-opacity-50'
          : ''
      }`}
    >
      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>

        {/* Current Bid with flash animation */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Current Bid</div>
          <div
            className={`text-3xl font-bold transition-colors duration-300 ${
              flashColor === 'green'
                ? 'text-green-600'
                : flashColor === 'red'
                ? 'text-red-600'
                : 'text-gray-900'
            }`}
          >
            ${currentBid}
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Time Remaining</div>
          <CountdownTimer
            auctionEndTime={item.auctionEndTime}
            itemStatus={item.itemStatus}
          />
        </div>

        {/* Status Badge */}
        {isAuthenticated && (
          <div className="mb-4">
            <StatusBadge status={getStatus()} itemStatus={item.itemStatus} />
          </div>
        )}

        {/* Bid Count */}
        {item.bidCount > 0 && (
          <div className="text-sm text-gray-500 mb-4">
            {item.bidCount} bid{item.bidCount !== 1 ? 's' : ''}
          </div>
        )}

        {/* Bidding Section */}
        {canBid && (
          <div className="space-y-4 mt-6 pt-4 border-t border-gray-200">
            {!showCustomBid ? (
              <>
                <BidButton
                  onBid={handleQuickBid}
                  disabled={isBidding}
                  isLoading={isBidding}
                />
                <button
                  onClick={() => setShowCustomBid(true)}
                  className="w-full py-2 px-4 rounded-md font-medium text-indigo-600 border border-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  Enter Custom Amount
                </button>
              </>
            ) : (
              <>
                <BidInput
                  currentBid={currentBid}
                  onBid={handlePlaceBid}
                  disabled={isBidding}
                  isLoading={isBidding}
                  error={bidError}
                />
                <button
                  onClick={() => setShowCustomBid(false)}
                  className="w-full py-2 px-4 rounded-md font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Use Quick Bid (+$10)
                </button>
              </>
            )}
          </div>
        )}

        {!isAuthenticated && !isEnded && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Please log in to place bids
          </div>
        )}

        {isEnded && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            This auction has ended
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionCard;
