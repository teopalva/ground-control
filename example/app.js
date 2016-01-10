/* eslint-disable react/no-multi-comp, no-console */

import React from 'react';
import { createStore } from 'redux';
import { makeHydratable } from './../modules/AsyncRedux';
import { Provider } from 'react-redux';

export const initializeStore = () => {
  const baseReducer = state => state;
  const store = createStore(makeHydratable(baseReducer));
  const s = () => console.log('STATE --->', JSON.stringify(store.getState()));
  store.subscribe(s);
  s();
  return store;
};

export const createApp = (store, routerContext) => (
  <Provider store={store} children={routerContext} />
);
