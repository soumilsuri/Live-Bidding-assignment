import { useTimeSync } from '../contexts/TimeSyncContext';

export const useTimeSyncHook = () => {
  return useTimeSync();
};
