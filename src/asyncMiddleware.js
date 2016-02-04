import {
  ASYNC_UPDATE,
  ACTION_SUCCESS,
} from './asyncReducer';

export default function asyncMiddleware() {
  return (next) => {
    return (action) => {
      if (action.asyncStatus) {
        let res;
        if (action.asyncStatus === ACTION_SUCCESS) {
          res = next(action);
        }

        next({
          type: ASYNC_UPDATE,
          originalAction: action,
        });

        return res;

      } else {
        return next(action);
      }
    };
  };
}
