import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';
import AsyncNestedRedux from 'modules/AsyncNestedRedux';
import createStore from 'example/createStore';
import DevTools from 'example/devtools';
import domready from 'domready';

// import { syncHistory, routeReducer } from 'redux-simple-router';

// if you use immutable for route reducers, set a property on route & use app level deserializer (optional)
// ...if you need to do something crazy like use combineReducers & immutable you can specify
// that on the route itself (see example/index-route/index.js)
const deserializer = (clientRoute, data) => {
  // if (clientRoute.deserializeImmutable) return fromJS(data);
  return data;
};

const routerProps = (routes, history, store, reducers) => ({
  routes,
  history,
  render: props => (
    <AsyncNestedRedux
        {...props}
        store={store}
        deserializer={deserializer}
        reducers={reducers}
        />
  ),
});

export default ({
  additionalReducers,
  enableDevTools,
  enableThunk,
  initialState,
  routes,
}) => {
  const store = createStore({
    additionalReducers,
    enableDevTools,
    enableThunk,
    initialState,
  });

  domready(() => {
    render((
      <Provider store={store}>
        <Router {...routerProps(routes, browserHistory, store, additionalReducers)} />
      </Provider>
    ), document.getElementById('app'));

    if (enableDevTools) {
      render(<DevTools store={store} />, document.getElementById('dev'));
    }
  });
};
