export const IS_CLIENT = typeof window !== 'undefined';
export const IS_SERVER = !IS_CLIENT;
export const HYDRATE = '@@AsyncNestedRedux/HYDRATE';
export const CHILD = '__child';
export const SELF = '__self';
export const FD_DONE = 'done';
export const FD_CLIENT_RENDER = 'client';
export const FD_SERVER_RENDER = 'server';
