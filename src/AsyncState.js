import I from 'immutable';

const AsyncState = I.Record({
  loaded: false,
  loading: null,
  error: null,
});

export default AsyncState;
