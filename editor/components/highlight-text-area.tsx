//import hljs from "../lib/highlight/core.min.js"
import hljs from 'highlight.js';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from "highlight.js/lib/languages/xml.js";
import css from "highlight.js/lib/languages/css.js";
import scss from "highlight.js/lib/languages/scss.js";
import markdown from "highlight.js/lib/languages/markdown.js";
import dockerfile from "highlight.js/lib/languages/dockerfile.js";
import yaml from "highlight.js/lib/languages/yaml.js";
import typescript from "highlight.js/lib/languages/typescript.js";
import c from "highlight.js/lib/languages/c.js";
import cpp from "highlight.js/lib/languages/cpp.js";
import bash from "highlight.js/lib/languages/bash.js";
import python from "highlight.js/lib/languages/python.js";
import text from "highlight.js/lib/languages/plaintext.js";
import json from "highlight.js/lib/languages/json.js";

/*import javascript from "../lib/highlight/languages/javascript.js";
import xml from "../lib/highlight/languages/xml.js";
import css from "../lib/highlight/languages/css.js";
import scss from "../lib/highlight/languages/scss.js";
import markdown from "../lib/highlight/languages/markdown.js";
import dockerfile from "../lib/highlight/languages/dockerfile.js";
import yaml from "../lib/highlight/languages/yaml.js";
import typescript from "../lib/highlight/languages/typescript.js";
import c from "../lib/highlight/languages/c.js";
import cpp from "../lib/highlight/languages/cpp.js";
import bash from "../lib/highlight/languages/bash.js";
import python from "../lib/highlight/languages/python.js";
import text from "../lib/highlight/languages/plaintext.js";
import json from "../lib/highlight/languages/json.js";*/

// Then register the languages you need
hljs.registerLanguage('text', text);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('scss', scss);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('python', python);
hljs.registerLanguage('json', json);

/*!
Theme: GitHub Dark
Description: Dark theme as seen on github.com
Author: github.com
Maintainer: @Hirse
Updated: 2021-05-15

Outdated base version: https://github.com/primer/github-syntax-dark
Current colors taken from GitHub's CSS
*/
const STYLE = `pre code.hljs{display:block;overflow-x:auto;padding:1em}code.hljs{padding:3px 5px}.hljs{color:#c9d1d9;background:#0d1117}.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_{color:#ff7b72}.hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_{color:#d2a8ff}.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable{color:#79c0ff}.hljs-meta .hljs-string,.hljs-regexp,.hljs-string{color:#a5d6ff}.hljs-built_in,.hljs-symbol{color:#ffa657}.hljs-code,.hljs-comment,.hljs-formula{color:#8b949e}.hljs-name,.hljs-quote,.hljs-selector-pseudo,.hljs-selector-tag{color:#7ee787}.hljs-subst{color:#c9d1d9}.hljs-section{color:#1f6feb;font-weight:700}.hljs-bullet{color:#f2cc60}.hljs-emphasis{color:#c9d1d9;font-style:italic}.hljs-strong{color:#c9d1d9;font-weight:700}.hljs-addition{color:#aff5b4;background-color:#033a16}.hljs-deletion{color:#ffdcd7;background-color:#67060c}code{outline: 0px solid rgba(0, 0, 0, 0.263);caret-color: red;}.hljs-name{color: #e8910d;}.hljs-tag .hljs-attr, .hljs-tag .hljs-name{color: #e8910d;}`;
const POSTTYLE = "pre{padding:0; margin:0;} code { background-color: #000000; color: #ffffff; }";
const TAG_NAME = "HIGHLIGHT-TEXT-AREA";

function runHighlight(content: string | null, language: string) {
  const now = Date.now();
  console.log("runHighlight [%s]", language);
  const value = hljs.highlight(String(content), {
    language,
    ignoreIllegals: true
  }).value;
  console.log("runHighlight [%s] took [%s]ms", language, Date.now() - now);
  return value;
}

function emitEvents(elementRef: any, topMost: any, content: string, oncontentchange?: (ev: CustomEvent) => void) {
  if (elementRef.current && topMost.current) {
    const currentContent = elementRef.current.textContent as any;
    const webComponentElement = (topMost.current as HTMLElement).parentNode as HTMLElement;
    const event = new CustomEvent("contentchange", { detail: currentContent });
    if (webComponentElement && webComponentElement instanceof HTMLElement && webComponentElement.tagName === TAG_NAME) {
      try {
        webComponentElement.dispatchEvent(event);
      } catch (e) {
        console.error(e);
      }
    }
    if (typeof oncontentchange === "function") {
      try {
        oncontentchange(event);
      } catch (e) {
        console.error(e);
      }
    }
  }
}

export function HighlightTextArea({ content, language, oncontentchange, tabChar, disabled }:
  { language: string; content: string; disabled?: string; tabChar?: string; oncontentchange?: (ev: CustomEvent) => void }
) {
  const elementRef = jsx.useRef();
  const topMost = jsx.useRef();
  const [lastLanguage, setlastLanguage] = jsx.useState(language);

  // effect to watch changes to language
  jsx.useEffect(() => {
    if (elementRef.current && (lastLanguage !== language || elementRef.current.textContent !== content)) {
      setlastLanguage(language);
      elementRef.current.innerHTML = runHighlight(content, language);
    }
  }, [lastLanguage, language, elementRef.current, content])

  return <pre ref={topMost}>
    <style innerHTML={STYLE + POSTTYLE} />
    <code
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      contenteditable={disabled ? "false" : "true"}
      ref={elementRef}
      tabindex="0"
      innerHTML={!elementRef.current ? runHighlight(content, language) : null}
      onfocusout={async (ev) => {
        ev.preventDefault();
        if (elementRef.current) {
          if (content !== elementRef.current.textContent) {
            //setlastContent(String(elementRef.current.textContent));
            elementRef.current.innerHTML = runHighlight(elementRef.current.textContent, language);
          }
        }
      }}
      onkeydown={ev => {
        if (ev.keyCode === 9) {
          ev.preventDefault();
          // now insert four non-breaking spaces for the tab key
          const sel = document.getSelection();
          if (sel && topMost.current) {
            if ((topMost.current as any).contains(sel.anchorNode)) {
              const range = sel.getRangeAt(0);
              const tabNode = document.createTextNode(tabChar ? tabChar : "\t");
              range.insertNode(tabNode);
              range.setStartAfter(tabNode);
              range.setEndAfter(tabNode);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }
          emitEvents(elementRef, topMost, content, oncontentchange);
        }
      }}
      oninput={ev => {
        ev.preventDefault();
        emitEvents(elementRef, topMost, content, oncontentchange);
      }} />
  </pre>
}

HighlightTextArea.asFragment = true;
HighlightTextArea.shadowInit = false;
