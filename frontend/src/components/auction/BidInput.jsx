import { useState } from 'react';

const BidInput = ({ currentBid, onBid, disabled, isLoading, error }) => {
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    setValidationError('');

    if (value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        setValidationError('Please enter a valid positive number');
      } else if (numValue <= currentBid) {
        setValidationError(`Bid must be higher than current bid of $${currentBid}`);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= currentBid) {
      setValidationError(`Bid must be higher than current bid of $${currentBid}`);
      return;
    }

    onBid(numAmount);
    setAmount('');
    setValidationError('');
  };

  const displayError = error || validationError;
  const isValid = amount && !validationError && parseFloat(amount) > currentBid;

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">
        Current bid: <span className="font-semibold">${currentBid}</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <input
            type="number"
            step="0.01"
            min={currentBid + 0.01}
            value={amount}
            onChange={handleAmountChange}
            disabled={disabled || isLoading}
            placeholder={`Enter amount above $${currentBid}`}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              displayError
                ? 'border-red-300 focus:ring-red-500'
                : isValid
                ? 'border-green-300 focus:ring-green-500'
                : 'border-gray-300'
            } disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
          {displayError && (
            <p className="mt-1 text-sm text-red-600">{displayError}</p>
          )}
          {isValid && !displayError && (
            <p className="mt-1 text-sm text-green-600">
              Valid bid (+${(parseFloat(amount) - currentBid).toFixed(2)})
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled || isLoading || !isValid}
          className={`w-full py-2 px-4 rounded-md font-medium text-white transition-colors ${
            disabled || isLoading || !isValid
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
          }`}
        >
          {isLoading ? 'Placing Bid...' : 'Place Bid'}
        </button>
      </form>
    </div>
  );
};

export default BidInput;
