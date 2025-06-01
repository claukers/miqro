import * as jsxLib from "@miqro/jsx/esm/lib.js";

declare global {
  // jsx only for the default value of tsconfig.json
  var React: {};
  var jsx: {
    define: (tagName: string, component: jsxLib.Component, options?: jsxLib.RuntimeElementDefinitionOptions) => void;
    useRuntime: typeof jsxLib.useRuntime;
    usePathname: typeof jsxLib.usePathname;
    Link: typeof jsxLib.Link;
    Router: typeof jsxLib.Router;
    createContext: typeof jsxLib.createContext;
    useContext: typeof jsxLib.useContext;
    useState: typeof jsxLib.useState;
    useEffect: typeof jsxLib.useEffect;
    useQuery: typeof jsxLib.useQuery;
    useRef: typeof jsxLib.useRef;
    useElement: typeof jsxLib.useElement;
    useRefresh: typeof jsxLib.useRefresh;
  }
  /*var useRuntime: typeof jsxLib.useRuntime;
  var usePathname: typeof jsxLib.usePathname;
  var Link: typeof jsxLib.Link;
  var Router: typeof jsxLib.Router;
  var createContext: typeof jsxLib.createContext;
  var useContext: typeof jsxLib.useContext;
  var useState: typeof jsxLib.useState;
  var useEffect: typeof jsxLib.useEffect;
  var useQuery: typeof jsxLib.useQuery;
  var useRef: typeof jsxLib.useRef;
  var useElement: typeof jsxLib.useElement;
  var useRefresh: typeof jsxLib.useRefresh;*/
  var JSX: {
    createElement: typeof jsxLib.createElement;
    Fragment: typeof jsxLib.Fragment;
    enableDebugLog: typeof jsxLib.enableDebugLog;
  }
}
