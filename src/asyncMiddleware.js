import {
  ASYNC_UPDATE,
  ACTION_SUCCESS,
} from './asyncReducer';

export default function asyncMiddleware(store) {
  return (next) => {
    return (action) => {
      if (action.asyncStatus) {
        store.dispatch({
          type: ASYNC_UPDATE,
          originalAction: action,
        });

        if (action.asyncStatus === ACTION_SUCCESS) {
          return next(action);
        }

      } else {
        return next(action);
      }
    };
  };
}
