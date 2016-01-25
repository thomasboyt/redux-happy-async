/*
 * This example shows how to create a generic, reusable action creator with redux-happy-async.
 *
 * An example action creator built on this might look like:
 *
 *   export function getUser(username) {
 *     return async function(dispatch) {
 *       await getJson(`https://api.github.com/users/${username}`, {
 *         dispatch,
 *         type: GET_USER,
 *         payload: {username},
 *       });
 *     };
 *   }
 */

import {
  ACTION_START,
  ACTION_SUCCESS,
  ACTION_ERROR,
} from 'redux-happy-async';

export default async function getJson(url, {dispatch, type, payload}) {
  dispatch({
    asyncStatus: ACTION_START,
    type,
    ...payload
  });

  const resp = await window.fetch(url);

  if (resp.status !== 200) {
    const respText = await resp.text();

    let error;
    try {
      error = JSON.parse(respText);
    } catch(err) {
      error = respText;
    }

    dispatch({
      asyncStatus: ACTION_ERROR,
      type,
      error,
      ...payload
    });
    return;
  }

  const responseJson = await resp.json();

  dispatch({
    asyncStatus: ACTION_SUCCESS,
    type,
    resp: responseJson,
    ...payload,
  });
}

