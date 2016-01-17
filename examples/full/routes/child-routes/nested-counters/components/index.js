import React from 'react';
import { IndexLink, Link } from 'react-router';
import { createReducer } from 'redux-act';
import { merge } from 'lodash';
import { getNestedState } from 'modules/AsyncNestedRedux';

import { actions as appActions } from 'examples/full/routes/components/index';
import createActions from 'examples/utils/createActions';
import { routeStyle, navStyle, linkStyle, activeLinkStyle } from 'examples/utils/style';

export const actions = createActions('NestedCounters', ['incr']);
export const reducer = createReducer({
  [actions.incr]: (state, payload) => {
    const updatedState = merge({}, state);
    updatedState.counter += payload;
    return updatedState;
  },
}, {
  counter: 0,
});

const linkProps = () => ({ style: linkStyle, activeStyle: activeLinkStyle });

// if you need parent data to adjust current reducer, use thunk actions
const specialAction = count => (dispatch/* , getState */) => {
  dispatch(appActions.incr(count));
  dispatch(actions.incr(count));
};

export default props => {
  const { children, dispatch, data, getState } = props;
  const applicationData = getNestedState(getState());

  return (
    <div style={routeStyle}>
      <div style={navStyle}>
        <IndexLink to="/nested-counters" {...linkProps()}>Nested Counters Home</IndexLink>
        <Link to="/nested-counters/multiply-counter" {...linkProps()}>Multiply Counters (Start at 3 (* 2))</Link>
        <Link to="/nested-counters/square-counter" {...linkProps()}>Square Counters (Start at 3)</Link>
      </div>
      <div>
        <p>
          <span>App Counter: {applicationData.counter || 0}</span>&nbsp;
          <span>Counter: {data.counter}</span>&nbsp;
          <button onClick={() => { dispatch(specialAction(1)); }}>+</button>
        </p>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};