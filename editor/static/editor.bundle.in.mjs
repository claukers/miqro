import { useElement, useRefresh, useQuery, define, Router, Link, useState, useEffect, useRef, createElement, Fragment } from "../../node_modules/@miqro/jsx-dom/build/jsx-dom.esm.bundle.js";
globalThis.jsx = Object.freeze({
  useState,
  useEffect,
  useQuery,
  useRef,
  useElement,
  useRefresh,
  createElement,
  Fragment,
  Link,
  Router
});
globalThis.browser = Object.freeze({
  define
});

import * as lib from "../../editor/components/bundle.js";

export const editor = lib;
