const BidButton = ({ onBid, disabled, isLoading }) => {
  return (
    <button
      onClick={onBid}
      disabled={disabled || isLoading}
      className={`w-full py-2 px-4 rounded-md font-medium text-white transition-colors ${
        disabled || isLoading
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
      }`}
    >
      {isLoading ? 'Placing Bid...' : 'Bid +$10'}
    </button>
  );
};

export default BidButton;
