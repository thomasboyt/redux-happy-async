import I from 'immutable';
import AsyncState from './AsyncState';

export const ACTION_START = 'START';
export const ACTION_SUCCESS = 'SUCCESS';
export const ACTION_ERROR = 'ERROR';
export const ACTION_RESET = 'RESET';
export const ASYNC_UPDATE = 'ASYNC_UPDATE';

const initialState = I.Map();

function getKeyPath(action) {
  if (action.uniqueId !== undefined) {
    const id = action.uniqueId;
    return [action.type, id];
  }

  return [action.type];
}

function updateAsyncState(action, state) {
  const keyPath = getKeyPath(action);

  if (action.asyncStatus === ACTION_START) {
    return state.setIn(keyPath, new AsyncState({
      loading: true,
    }));

  } else if (action.asyncStatus === ACTION_ERROR) {
    if (!action.error) {
      throw new Error(`${action.type} was triggered with an error status but no \`error\` field was passed`);
    }

    return state
      .setIn([...keyPath, 'loading'], false)
      .setIn([...keyPath, 'loaded'], false)
      .setIn([...keyPath, 'error'], action.error);

  } else if (action.asyncStatus === ACTION_SUCCESS) {
    return state
      .setIn([...keyPath, 'loading'], false)
      .setIn([...keyPath, 'loaded'], true)
      .setIn([...keyPath, 'error'], null);

  } else if (action.asyncStatus === ACTION_RESET) {
    if (action.all === true) {
      // reset all action states for this type
      const states = state.get(action.type);

      if (states) {
        return state.set(action.type, states.map((actionState) =>
          actionState
            .set('loading', false)
            .set('loaded', false)
            .set('error', null)
        ));

      } else {
        return state;
      }
    }

    return state
      .setIn([...keyPath, 'loading'], false)
      .setIn([...keyPath, 'loaded'], false)
      .setIn([...keyPath, 'error'], null);
  }

  throw new Error(`Async action ${action.type} triggered with unknown status ${action.status}`);
}

export default function asyncReducer(state=initialState, action) {
  switch (action.type) {
    case ASYNC_UPDATE:
      return updateAsyncState(action.originalAction, state);
    default:
      return state;
  }
}
