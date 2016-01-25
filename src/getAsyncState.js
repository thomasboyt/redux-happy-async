import AsyncState from './AsyncState';

export default function getAsyncState(state, type, id) {
  let path;

  if (id !== undefined) {
    path = [type, id];
  } else {
    path = [type];
  }

  const asyncState = state.async.getIn(path);

  if (!asyncState) {
    return new AsyncState();
  }

  return asyncState;
}
