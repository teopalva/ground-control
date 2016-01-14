/* global __INITIAL_DATA__ */

import matchRoutes from 'react-router/lib/matchRoutes';
import { createRoutes } from 'react-router/lib/RouteUtils';
import { browserHistory } from 'react-router';
import normalizeRoutes from './normalizeRoutes';
import deserialize from './deserialize';
import { IS_CLIENT } from './constants';
import { map } from 'lodash';

const initialData = IS_CLIENT && typeof __INITIAL_DATA__ !== 'undefined' ? __INITIAL_DATA__ : null;
const defaultState = {};
let cachedState = null;

const deserializeRoutes = (routes, hydratedRoutes) => {
  return map(normalizeRoutes(routes), (route, index) => {
    const hydratedRoute = hydratedRoutes[index];
    route.blockRender = hydratedRoute.blockRender;
    route.loading = hydratedRoute.loading;
    return route;
  });
};

export default (routes, cb, deserializer = null) => {
  if (cachedState) {
    cb(cachedState);
    return;
  }

  if (initialData) {
    const {
      initialState: hydratedState,
      initialRoutes: hydratedRoutes,
    } = initialData;

    const unlisten = browserHistory.listen(location => {
      matchRoutes(createRoutes(routes), location, (err, matchedRoutes) => {
        if (err) cb(defaultState);
        const initialRoutes = deserializeRoutes(matchedRoutes.routes, hydratedRoutes);
        const initialState = deserialize(hydratedState, initialRoutes, deserializer);

        cachedState = initialState;
        cb(initialState);
      });
    });

    unlisten();
  } else {
    cb(defaultState);
  }
};
