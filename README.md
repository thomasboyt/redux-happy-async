# redux-happy-async

**(this repo isn't ready for usage yet)**

Tries to cut some of the more obnoxious boilerplate out of handling async state in Redux.

Assumes you're using an [Immutable](https://facebook.github.io/immutable-js/) map as reducer state.

Basically this adds an `async` field to your reducer's state that contains async state per action you define using `createAsyncReducer`.

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
      dispatch({
        type: LOAD_TODOS,
        status: ACTION_ERROR
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
