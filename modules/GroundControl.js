import React from 'react';
import RouterContext from 'react-router/lib/RouterContext';
import computeChangedRoutes from 'react-router/lib/computeChangedRoutes';
import asyncEnter from './asyncEnter';
import createElement from './createElement';
import normalizeRoutes from './normalizeRoutes';
import { getNestedState, nestedStateValid } from './nestedState';
import { nestAndReplaceReducersAndState, nestAndReplaceReducers, hydrateStore } from './nestReducers';
import loadStateOnServer from './loadStateOnServer';
import hydrateClient from './hydrateClient';
import updateRouteState from './updateRouteState';
import { NAMESPACE, ROOT_DEPTH, IS_CLIENT } from './constants';
import { partial, dropRight } from 'lodash';

export default class extends React.Component {
  static propTypes = {
    render: React.PropTypes.func.isRequired, routes: React.PropTypes.array.isRequired,
    location: React.PropTypes.object.isRequired, router: React.PropTypes.object.isRequired,
    store: React.PropTypes.object.isRequired, params: React.PropTypes.object.isRequired,
    initialData: React.PropTypes.object.isRequired, reducers: React.PropTypes.object.isRequired,
    serializer: React.PropTypes.func.isRequired, deserializer: React.PropTypes.func.isRequired,
  };

  static defaultProps = {
    initialData: {}, reducers: {},
    serializer: (route, state) => state,
    deserializer: (route, state) => state,

    render(props, routes) {
      const finalCreateElement = partial(createElement, props.store, props.serializer);
      return (
        <RouterContext {...props} routes={routes}
            createElement={finalCreateElement} />
      );
    },
  };

  constructor(props, context) {
    super(props, context);

    const { initialData, store, routes: baseRoutes, deserializer } = props;
    const reducers = this.normalizeReducers();

    let { initialState, initialRoutes } = initialData;
    initialRoutes = initialRoutes ? initialRoutes : normalizeRoutes(baseRoutes, props);

    if (IS_CLIENT) {
      const { hydratedState, hydratedRoutes } = hydrateClient(props, initialRoutes, deserializer);
      if (hydratedState && hydratedRoutes) {
        initialRoutes = hydratedRoutes;
        initialState = hydratedState;
      }
    }

    const useInitialState = nestedStateValid(initialState);
    const useInitialStoreState = nestedStateValid(store.getState());

    if (useInitialState && !useInitialStoreState) {
      nestAndReplaceReducers(store, initialRoutes, reducers);
      hydrateStore(initialState, store);
    } else {
      this.nestReducers(store, initialRoutes, reducers, useInitialState);
    }

    this.state = {
      routes: initialRoutes,
      reducers, useInitialState,
      storeState: store.getState(),
    };
  }

  componentDidMount() {
    this.callAsyncEnter(this.state.routes, this.props.params, this.props.location.query);
  }

  componentWillReceiveProps(nextProps) {
    const { location: prevLocation, store } = this.props;
    const { location: nextLocation, params: nextRouteParams } = nextProps;
    const { routes: prevRoutes, reducers } = this.state;
    const { query: nextRouteQuery } = nextLocation;

    const pathChanged = nextLocation.pathname !== prevLocation.pathname;
    const searchChanged = nextLocation.search !== prevLocation.search;
    const routeChanged = pathChanged || searchChanged;
    if (!routeChanged) return;

    const { enterRoutes: rawEnterRoutes, leaveRoutes } = computeChangedRoutes({
      ...this.props, routes: prevRoutes,
    }, nextProps);

    const keepRoutes = dropRight(prevRoutes, leaveRoutes.length);
    const enterRoutes = normalizeRoutes(rawEnterRoutes, nextProps, keepRoutes.length, true);
    const nextRoutes = keepRoutes.concat(enterRoutes);

    this.nestReducers(
      store, nextRoutes, reducers,
      false, keepRoutes.length
    );

    this.setState({
      storeState: store.getState(),
      routes: nextRoutes,
      useInitialState: false,
    }, () => {
      this.callAsyncEnter(
        nextRoutes, nextRouteParams,
        nextRouteQuery, keepRoutes.length
      );
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
    this._unmounted = true;
  }

  unsubscribe() {
    return null;
  }

  resubscribe() {
    const { store } = this.props;
    return store.subscribe(() => {
      this.setState({
        storeState: store.getState(),
      });
    });
  }

  normalizeReducers() {
    const reducers = this.props.reducers || {};
    reducers[NAMESPACE] = (state = {}) => state;
    return reducers;
  }

  nestReducers(store, routes, reducers, useInitialState = false, replaceAtDepth = ROOT_DEPTH) {
    this.unsubscribe();
    if (useInitialState) {
      nestAndReplaceReducers(store, routes, reducers);
    } else {
      nestAndReplaceReducersAndState(store, routes, reducers, replaceAtDepth);
    }
  }

  asyncEnterCallback(loadingError, redirect, type, route, depth) {
    if (!this._unmounted) {
      const { routes } = this.state;
      if (routes[depth] === route) {
        if (redirect) {
          this.props.router.replace(redirect);
        } else {
          updateRouteState(this.props.store, depth, type, loadingError);
        }
      }
    }
  }

  stillActiveCallback(route, index) {
    return this.state.routes[index] === route;
  }

  callAsyncEnter(routes, routeParams, queryParams, replaceAtDepth = ROOT_DEPTH) {
    const { store } = this.props;
    const { useInitialState } = this.state;
    this.unsubscribe = this.resubscribe();

    asyncEnter(
      routes, routeParams, queryParams, store,
      this.asyncEnterCallback.bind(this),
      this.stillActiveCallback.bind(this),
      useInitialState, replaceAtDepth
    );
  }

  render() {
    return this.props.render(
      this.props, this.state.routes
    );
  }
}

export {
  loadStateOnServer,
  getNestedState,
};
