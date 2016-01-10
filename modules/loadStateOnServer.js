import loadAsyncState from './loadAsyncState';
import normalizeRoutes from './normalizeRoutes';
import { nestAndReplaceReducersAndState } from './nestReducers';
import { map, cloneDeep } from 'lodash';

export default (props, store, cb) => {
  const { routes: rawRoutes, params } = props;
  const routes = cloneDeep(normalizeRoutes(rawRoutes));
  const reducers = map(routes, route => route.reducer);
  nestAndReplaceReducersAndState(store, 0, ...reducers);

  let needToLoadCounter = routes.length;
  const maybeFinish = () => {
    if (needToLoadCounter === 0) {
      const json = JSON.stringify({ state: store.getState(), routes });
      const scriptString = `<script>window.__INITIAL_DATA__=${json}</script>`;
      cb(null, routes, scriptString);
    }
  };

  loadAsyncState(
    routes,
    params,
    store.dispatch,
    (type, route, index) => {
      if (type === 'done' || type === 'server') {
        routes[index].blockRender = false;
        if (type === 'done') {
          routes[index].loading = false;
        }
        --needToLoadCounter;
        maybeFinish();
      }
    }
  );
};
