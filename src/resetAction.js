import {ACTION_RESET} from './asyncReducer';

export default function resetAction(type, {all, uniqueId}) {
  return {
    asyncStatus: ACTION_RESET,
    type,
    all,
    uniqueId,
  };
}
