import {
  ACTION_START,
  ACTION_SUCCESS,
  ACTION_ERROR,
} from './asyncReducer';

export default async function getJson(url, {dispatch, type, payload}) {
  dispatch({
    status: ACTION_START,
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
      status: ACTION_ERROR,
      type,
      error,
      ...payload
    });
    return;
  }

  const responseJson = await resp.json();

  dispatch({
    status: ACTION_SUCCESS,
    type,
    resp: responseJson,
    ...payload,
  });
}

