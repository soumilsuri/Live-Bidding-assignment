import { useState, useEffect } from 'react';
import { useTimeSync } from '../../contexts/TimeSyncContext';
import { calculateTimeRemaining, formatTimeRemaining, isAuctionEnded } from '../../utils/timeSync';

const CountdownTimer = ({ auctionEndTime, itemStatus }) => {
  const { timeDrift } = useTimeSync();
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (itemStatus === 'ENDED') {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = calculateTimeRemaining(auctionEndTime, timeDrift);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [auctionEndTime, timeDrift, itemStatus]);

  const ended = isAuctionEnded(auctionEndTime, timeDrift) || itemStatus === 'ENDED';

  return (
    <div className={`text-lg font-semibold ${ended ? 'text-red-600' : 'text-green-600'}`}>
      {ended ? 'Auction Ended' : formatTimeRemaining(timeRemaining)}
    </div>
  );
};

export default CountdownTimer;
