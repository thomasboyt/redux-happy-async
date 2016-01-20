import AsyncState from './AsyncState';

export default function getAsyncState(reducerState, type, id) {
  let path;

  if (id !== undefined) {
    path = ['async', type, id];
  } else {
    path = ['async', type];
  }

  const state = reducerState.getIn(path);

  if (!state) {
    return new AsyncState();
  }

  return state;
}
