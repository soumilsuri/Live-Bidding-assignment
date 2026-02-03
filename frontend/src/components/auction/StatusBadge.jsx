const StatusBadge = ({ status, itemStatus }) => {
  if (itemStatus === 'ENDED') {
    if (status === 'WON') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Winner
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          Ended
        </span>
      );
    }
  }

  if (status === 'WINNING') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        Winning
      </span>
    );
  }

  if (status === 'OUTBID') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
        Outbid
      </span>
    );
  }

  return null;
};

export default StatusBadge;
