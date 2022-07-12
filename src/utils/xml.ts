import { parser } from "sax";

type Tag = {
  type: "root" | "comment" | "node" | "text";
  text?: string;
  name: string;
  attributes: NodeJS.Dict<string | { name: string; value: string; prefix: string; local: string; uri: string; }>;
  isSelfClosing: boolean;
  children: Tag[];
}
type Tree<T> = { readonly parent?: Tree<T>; readonly ref: T }

export const parseXML2JSON = async (val: string): Promise<any> => {
  return new Promise<any>((resolve, reject) => {
    const ret: Tag = {
      name: "ROOT",
      attributes: {},
      type: "root",
      isSelfClosing: false,
      text: "",
      children: []
    };
    let current: undefined | Tree<Tag> = {
      ref: ret
    };
    const p = parser(false, {
      noscript: true,
      lowercase: true
    })
    p.onerror = (e: Error) => {
      console.error(e);
      reject(e);
    };
    p.oncomment = (c: string) => {
      if (!current) {
        console.error("current null");
        process.exit(1);
      }
      const node: Tag = {
        name: "COMMENT",
        attributes: {},
        type: "comment",
        isSelfClosing: true,
        text: c,
        children: []
      };
      current.ref.children.push(node);
    };
    p.ontext = (t: string) => {
      if (!current) {
        console.error("current null");
        process.exit(1);
      }
      const node: Tag = {
        name: "TEXT",
        attributes: {},
        type: "text",
        isSelfClosing: true,
        text: t,
        children: []
      };
      current.ref.children.push(node);
    };
    p.onopentag = (t) => {
      if (!current) {
        console.error("current null");
        process.exit(1);
      }
      const node: Tag = {
        ...t,
        type: "node",
        text: "",
        children: []
      };
      node.type = "node";
      node.text = "";
      node.children = [];

      current.ref.children.push(node);
      current = {
        parent: current,
        ref: node
      }
    }
    /*p.onattribute = (attr: XMLAttr) => {
      
    };*/
    p.onclosetag = () => {
      if (!current) {
        console.error("current null");
        process.exit(1);
      }
      current = current.parent ? current.parent : {
        ref: ret
      };
    };
    p.onend = () => {
      resolve(ret);
    };
    p.write(val).close();
  });
};
