# redux-happy-async

**(this repo isn't ready for usage yet)**

Tries to cut some of the more obnoxious boilerplate out of handling async state in Redux.

Assumes you're using an [Immutable](https://facebook.github.io/immutable-js/) map as reducer state.

Basically this adds an `async` field to your reducer's state that contains async state per action you define using `createAsyncReducer`.

### Example

https://github.com/thomasboyt/earthling-github-issues

### Usage

So your reducer might look something like this:

```js
import {createAsyncReducer} from 'redux-happy-async';

const State = I.Record({
  async: null,
  todos: null,
});

const myReducer = createImmutableReducer(new State(), {
  ...createAsyncReducer({
    type: LOAD_TODOS,

    onSuccess: ({todos}, state) => {
      return state.set('todos', todos);
    }
  }
});
```

You could create an action that looked like:

```js
import {ACTION_START, ACTION_SUCCESS, ACTION_ERROR} from 'redux-happy-async';

export function getTodos() {
  return async function(dispatch) {
    dispatch({
      type: LOAD_TODOS,
      status: ACTION_START
    });

    const resp = await window.fetch(/*...*/);

    if (resp.status !== 200) {
      const err = await resp.json();

      dispatch({
        type: LOAD_TODOS,
        status: ACTION_ERROR,
        error: err,
      });
    }

    const data = await resp.json();

    dispatch({
      type: LOAD_TODOS,
      status: ACTION_SUCCESS,
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
    loadingState: getAsyncState(state.todos, LOAD_TODOS)
  };
}

export default connect(select)(TodosList);
```

You can also create further abstractions, look in `example/` for some.

### Unique Key

Of course, in some cases, your application may have multiple inflight actions of the same type. For example, imagine a todo list with a "complete" action that saves to a very, very slow server. You might click the "complete" checkbox for multiple items at once, and need to separately track the state of each item's "complete" action.

In that case, you'll want to set a "unique key" that the async reducer will read from the action payload. For example, given a "complete todo" action:

```js
import {ACTION_START, ACTION_SUCCESS, ACTION_ERROR} from 'redux-happy-async';
import {COMPLETE_TODO} from '../ActionTypes';

export function completeTodo(todoId) {
  return async function(dispatch) {
    dispatch({
      type: COMPLETE_TODO,
      status: ACTION_START,

      // we pass todoId here since it is the "unique key" for this action
      todoId,
    });

    const resp = await window.fetch(/*...*/);

    if (resp.status !== 200) {
      const err = await resp.json();

      dispatch({
        type: COMPLETE_TODO,
        status: ACTION_ERROR,
        todoId,
        error: err,
      });
    }

    dispatch({
      type: COMPLETE_TODO,
      status: ACTION_SUCCESS,
      todoId,
    });
  };
}
```

And this reducer:

```js
import {createAsyncReducer} from 'redux-happy-async';
import {COMPLETE_TODO} from '../ActionTypes';

const State = I.Record({
  async: null,
  todos: null,
});

const todosReducer = createImmutableReducer(new State(), {
  ...createAsyncReducer({
    type: COMPLETE_TODO,

    // this is the key that will be read from the action payload to get the unique ID
    uniqueKey: 'todoId',

    onSuccess: ({todoId}, state) => {
      return state.setIn(['todos', id, 'completed'], true);
    }
  }
});
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
    completeAsyncState: getAsyncState(state.todos, COMPLETE_TODO, todoId)
  };
}

export default connect(select)(TodosList);
```
