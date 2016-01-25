import expect from 'expect';

import I from 'immutable';
import {createStore, combineReducers, applyMiddleware} from 'redux';

import {
  asyncReducer,
  asyncMiddleware,
  getAsyncState,
  ACTION_START,
  ACTION_SUCCESS
} from '../';

const initialState = I.Map();

const LOAD_TODOS = 'LOAD_TODOS';
const COMPLETE_TODO = 'COMPLETE_TODO';

const mockTodos = [
  {id: 1, text: 'improve async boilerplate in redux', complete: false},
  {id: 2, text: 'fix javascript', complete: false}
];

function todoReducer(state=initialState, action) {
  switch (action.type) {
    case LOAD_TODOS:
      return state.set('todos', I.Map(action.todos.map((todo) => [todo.id, I.Map(todo)])));
    case COMPLETE_TODO:
      return state.setIn(['todos', action.id, 'complete'], true);
    default:
      return state;
  }
}

describe('async reducer', () => {
  let store;

  beforeEach(() => {
    store = applyMiddleware(asyncMiddleware)(createStore)(combineReducers({
      async: asyncReducer,
      todos: todoReducer
    }));
  });

  it('is updated when an async action is triggered', () => {
    store.dispatch({
      type: LOAD_TODOS,
      asyncStatus: ACTION_START,
    });

    expect(getAsyncState(store.getState(), LOAD_TODOS).loading).toBe(true);

    store.dispatch({
      type: LOAD_TODOS,
      asyncStatus: ACTION_SUCCESS,
      todos: mockTodos,
    });

    expect(getAsyncState(store.getState(), LOAD_TODOS).loading).toBe(false);
    expect(store.getState().todos.get('todos')).toExist();
  });

  describe('uniqueId', () => {
    it('updates the correct path', () => {
      const id = 1;

      store.dispatch({
        type: LOAD_TODOS,
        todos: mockTodos,
      });

      expect(store.getState().todos.getIn(['todos', id, 'complete'])).toBe(false);

      store.dispatch({
        type: COMPLETE_TODO,
        asyncStatus: ACTION_START,
        uniqueId: id,
      });

      expect(getAsyncState(store.getState(), COMPLETE_TODO, id).loading).toBe(true);

      store.dispatch({
        type: COMPLETE_TODO,
        asyncStatus: ACTION_SUCCESS,
        uniqueId: id,
        id,
      });

      expect(getAsyncState(store.getState(), COMPLETE_TODO, id).loading).toBe(false);
      expect(store.getState().todos.getIn(['todos', id, 'complete'])).toBe(true);
    });
  });
});
