import { useElement, useRefresh, useQuery, define, useState, useEffect, useRef, createElement, Fragment } from "../../node_modules/@miqro/jsx-dom/build/jsx-dom.esm.bundle.js";
globalThis.JSX = Object.freeze({
  createElement,
  Fragment
});

globalThis.jsx = Object.freeze({
  define,
  useState,
  useEffect,
  useQuery,
  useRef,
  useElement,
  useRefresh
});

import * as lib from "../../editor/http/admin/editor/editor.js";

export const editor = lib;
