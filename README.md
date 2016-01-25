# redux-happy-async

**(this library isn't tested, battle-tested, or recommended for usage yet!)**

Tries to cut some of the more obnoxious boilerplate out of handling async state in Redux.

Basically, this adds an `async` reducer to your store's state that contains async state per action.

### Example

https://github.com/thomasboyt/earthling-github-issues

### Usage

First, add the async reducer and middleware to your Redux store:

```js
import {createStore, combineReducers, applyMiddleware} from 'redux';
import {asyncReducer, asyncMiddleware} from 'redux-happy-async';

// thunk middleware is optional, but used in below examples
const createStoreWithMiddleware = applyMiddleware(thunkMiddleware, asyncMiddleware)(createStore);

const store = createStoreWithMiddleware(combineReducers({
  async: asyncReducer,
  // ...
}));
```

Then, your reducer might look something like this:

```js
const State = I.Record({
  todos: null,
});

export default function todoReducer(state=new State(), action) {
  switch (action.type) {
    case LOAD_TODOS:
      // This action is only actually received by the reducer if `asyncStatus: ACTION_START` is part
      // of the payload!
      return state.set('todos', action.todos);
    default:
      return state;
  }
}
```

You could create an action that looked like:

```js
import {ACTION_START, ACTION_SUCCESS, ACTION_ERROR} from 'redux-happy-async';

export function getTodos() {
  return async function(dispatch) {
    dispatch({
      type: LOAD_TODOS,
      asyncStatus: ACTION_START
    });

    const resp = await window.fetch(/*...*/);

    if (resp.status !== 200) {
      const err = await resp.json();

      dispatch({
        type: LOAD_TODOS,
        asyncStatus: ACTION_ERROR,
        error: err,
      });
    }

    const data = await resp.json();

    dispatch({
      type: LOAD_TODOS,
      asyncStatus: ACTION_SUCCESS,
      todos: data
    });
  };
}
```

Then inside your component you could do something like:

```js
import React from 'react';
import {connect} from 'react-redux';

import {getAsyncState} from 'redux-happy-async';

const TodosList = React.createClass({
  componentWillMount() {
    this.props.dispatch(getTodos());
  },

  render() {
    if (this.props.loadingState.loading || !this.props.todos) {
      return <span>Loading...</span>;

    } else if (this.props.loadingState.error) {
      return <span>Encountered error loading</span>;

    } else {
      return todos.map((todo) => {/*...*/});
    }
  }
});

function select(state) {
  return {
    todos: state.todos.todos,
    loadingState: getAsyncState(state, LOAD_TODOS)
  };
}

export default connect(select)(TodosList);
```

You can also create further abstractions, look in `example/` for some.

#### Using Unique IDs

Of course, in some cases, your application may have multiple inflight actions of the same type. For example, imagine a todo list with a "complete" action that saves to a very, very slow server. You might click the "complete" checkbox for multiple items at once, and need to separately track the state of each item's "complete" action.

In that case, you'll want to set a `uniqueId` on the action payload that the async reducer will use to determine which state to update. For example, given a "complete todo" action:

```js
import {ACTION_START, ACTION_SUCCESS, ACTION_ERROR} from 'redux-happy-async';
import {COMPLETE_TODO} from '../ActionTypes';

export function completeTodo(todoId) {
  return async function(dispatch) {
    dispatch({
      type: COMPLETE_TODO,
      asyncStatus: ACTION_START,

      // we pass todoId here since it is the "unique key" for this action
      uniqueId: todoId,
    });

    const resp = await window.fetch(/*...*/);

    if (resp.status !== 200) {
      const err = await resp.json();

      dispatch({
        type: COMPLETE_TODO,
        asyncStatus: ACTION_ERROR,
        uniqueId: todoId,
        error: err,
      });
    }

    dispatch({
      type: COMPLETE_TODO,
      asyncStatus: ACTION_SUCCESS,
      uniqueId: todoId,
    });
  };
}
```

And this reducer:

```js
const State = I.Record({
  todos: null,
});

export default function todoReducer(state=new State(), action) {
  switch (action.type) {
    case LOAD_TODOS:
      return state.set('todos', I.Map(action.todos.map((todo) => [todo.id, I.Map(todo)])));
    case COMPLETE_TODO:
      return state.setIn(['todos', action.id, 'complete'], true);
    default:
      return state;
  }
}
```

You could create an individual todo component that displays the async state of its complete action:

```js
import React from 'react';
import {connect} from 'react-redux';

import {getAsyncState} from 'redux-happy-async';

import {COMPLETE_TODO} from '../ActionTypes';
import {completeTodo} from './actions/TodoActions';

const Todo = React.createClass({
  propTypes: {
    todoId: React.PropTypes.number.isRequired,
  },

  handleComplete() {
    this.props.dispatch(completeTodo(this.props.todoId));
  },

  renderComplete() {
    const {completeAsyncState} = this.props;

    if (completeAsyncState.error) {
      return (
        <span>error completing. <a onClick={this.handleComplete}>retry?</a>
      );
    } else if (completeAsyncState.loading) {
      return (
        <span>loading...</span>
      );
    } else {
      return (
        <a onClick={this.handleComplete}>complete</a>
      );
    }
  },

  render() {
    const {todo} = this.props;

    return (
      <li>
        {todo.text}
        {' '}
        {todo.completed === false &&
          <a onClick={this.handleComplete}>complete</a>}
      </li>
    );
  }
});

function select(state, props) {
  const {todoId} = props;

  return {
    todo: state.todos.todos.get(todoId),

    // Note the third argument to getAsyncState!
    completeAsyncState: getAsyncState(state, COMPLETE_TODO, todoId)
  };
}

export default connect(select)(TodosList);
```
