import AsyncState from './AsyncState';

function noop(action, state) {
  return state;
}

const types = {};

export const ACTION_START = 'START';
export const ACTION_SUCCESS = 'SUCCESS';
export const ACTION_ERROR = 'ERROR';
export const ACTION_RESET = 'RESET';

/*
 * actionType - an actionType
 * onStart, onSuccess, onError (all optional) - called with (action, state) after async state is set
 *
 * uniqueKey (optional) -
 *   used to maintain multiple states under the same namespace.
 *   so, e.g. if you had 5 todos that had a "complete" action that need to have separately tracked
 *   state, you would set uniqueKey to something like `todoId`, and then pass that as a key in your
 *   action payload. then the cancel todo's async action state would be available under
 *   `['cancelTodoState', todoId, 'loading|error']`.
 *
 *   without this, it's assumed only one instance of this async action is going at once
 */
export default function createAsyncReducer({type, onStart, onSuccess, onError, uniqueKey}) {

  // Prevent creating multiple reducers with the same action type, since this breaks the reset system
  if (types[type]) {
    throw new Error(`Cannot create duplicate async reducer for action ${type}`);
  }

  types[type] = true;

  onStart = onStart || noop;
  onSuccess = onSuccess || noop;
  onError = onError || noop;

  function getKeyPath(action) {
    if (uniqueKey) {
      let id;
      if (typeof uniqueKey === 'function') {
        id = uniqueKey(action);
      } else {
        id = action[uniqueKey];
      }

      if (id === undefined) {
        throw new Error(`Could not get unique id ${uniqueKey} for async reducer for ${action.type}, did you pass it?`);
      }

      return ['async', type, id];
    }

    return ['async', type];
  }

  return {
    [type]: function(action, state) {
      if (!action.status) {
        throw new Error(`Async action ${action.type} requires status field to be passed`);
      }

      const keyPath = getKeyPath(action);

      if (action.status === ACTION_START) {
        const newState = state.setIn(keyPath, new AsyncState({
          loading: true,
        }));

        return onStart(action, newState);

      } else if (action.status === ACTION_ERROR) {
        if (!action.error) {
          throw new Error(`${action.type} was triggered with an error status but no error was passed`);
        }

        const newState = state
          .setIn([...keyPath, 'loading'], false)
          .setIn([...keyPath, 'loaded'], false)
          .setIn([...keyPath, 'error'], action.error);

        return onError(action, newState);

      } else if (action.status === ACTION_SUCCESS) {
        const newState = state
          .setIn([...keyPath, 'loading'], false)
          .setIn([...keyPath, 'loaded'], true)
          .setIn([...keyPath, 'error'], null);

        return onSuccess(action, newState);

      } else if (action.status === ACTION_RESET) {
        if (action.all === true) {
          // reset all action states for this type
          return state.updateIn(['async', type], (states) => states.map((actionState) =>
            actionState
              .set('loading', false)
              .set('loaded', false)
              .set('error', null)
          ));
        }

        return state
          .setIn([...keyPath, 'loading'], false)
          .setIn([...keyPath, 'loaded'], false)
          .setIn([...keyPath, 'error'], null);
      }

      throw new Error(`Async action ${action.type} triggered with unknown status ${action.status}`);
    },
  };
}
