import { useState, useEffect, useCallback } from 'react';
import useSocket from './useSocket';
import useAuth from './useAuth';

export const useAuction = (itemId, currentBid, highestBidderId) => {
  const { socket, isConnected, joinAuction, leaveAuction, placeBid } = useSocket();
  const { user } = useAuth();
  const [localBid, setLocalBid] = useState(currentBid);
  const [localHighestBidderId, setLocalHighestBidderId] = useState(highestBidderId);
  const [isBidding, setIsBidding] = useState(false);
  const [bidError, setBidError] = useState(null);
  const [flashColor, setFlashColor] = useState(null);

  // Update local state when props change
  useEffect(() => {
    setLocalBid(currentBid);
    setLocalHighestBidderId(highestBidderId);
  }, [currentBid, highestBidderId]);

  // Join auction room on mount
  useEffect(() => {
    if (itemId && isConnected) {
      joinAuction(itemId);
    }

    return () => {
      if (itemId && isConnected) {
        leaveAuction(itemId);
      }
    };
  }, [itemId, isConnected, joinAuction, leaveAuction]);

  // Listen for UPDATE_BID events
  useEffect(() => {
    if (!socket) return;

    const handleUpdateBid = (data) => {
      if (String(data.itemId) === String(itemId)) {
        setLocalBid(data.currentBid);
        setLocalHighestBidderId(data.highestBidderId);
        setFlashColor('green');
        setIsBidding(false);
        setBidError(null);
        
        // Clear flash after animation
        setTimeout(() => setFlashColor(null), 500);
      }
    };

    const handleOutbidError = (data) => {
      if (data.code === 'OUTBID' || data.code === 'BID_TOO_LOW') {
        setFlashColor('red');
        setBidError(data.message || 'Bid failed');
        setIsBidding(false);
        
        // Update current bid if provided
        if (data.currentBid) {
          setLocalBid(data.currentBid);
        }
        
        // Clear flash after animation
        setTimeout(() => {
          setFlashColor(null);
          setBidError(null);
        }, 3000);
      }
    };

    const handleAuctionState = (data) => {
      if (String(data.itemId) === String(itemId)) {
        setLocalBid(data.currentBid);
        setLocalHighestBidderId(data.highestBidderId);
      }
    };

    socket.on('UPDATE_BID', handleUpdateBid);
    socket.on('OUTBID_ERROR', handleOutbidError);
    socket.on('AUCTION_STATE', handleAuctionState);

    return () => {
      socket.off('UPDATE_BID', handleUpdateBid);
      socket.off('OUTBID_ERROR', handleOutbidError);
      socket.off('AUCTION_STATE', handleAuctionState);
    };
  }, [socket, itemId, user]);

  const handlePlaceBid = useCallback((amount) => {
    if (!isConnected || isBidding) return;
    
    if (amount <= localBid) {
      setBidError(`Bid must be higher than current bid of $${localBid}`);
      return;
    }

    setIsBidding(true);
    setBidError(null);
    placeBid(itemId, amount);
  }, [itemId, localBid, isConnected, isBidding, placeBid]);

  const handleQuickBid = useCallback(() => {
    const newBid = localBid + 10;
    handlePlaceBid(newBid);
  }, [localBid, handlePlaceBid]);

  const isWinning = user && localHighestBidderId && String(localHighestBidderId) === String(user._id);

  return {
    currentBid: localBid,
    highestBidderId: localHighestBidderId,
    isBidding,
    bidError,
    flashColor,
    isWinning,
    handlePlaceBid,
    handleQuickBid,
  };
};
