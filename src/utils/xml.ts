const {parser} = require("sax");

type XMLAttr = { name: string; value: string; };
type Tag = { type: "root" | "comment" | "node" | "text"; text?: string; name: string; attributes: NodeJS.Dict<string>; isSelfClosing: boolean; children: Tag[]; }
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
    const p = parser(undefined, {
      noscript: true,
      trim: true
    });
    p.onerror = (e: Error) => {
      // an error happened.
      console.error(e);
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
    p.onopentag = (node: Tag) => {
      // opened a tag.  node has "name" and "attributes"
      /*if (node.name.toLocaleLowerCase() === "bpmn:sequenceflow") {
        console.log("open %o", node);
      }*/
      if (!current) {
        console.error("current null");
        process.exit(1);
      }
      node.type = "node";
      node.text = "";
      node.children = [];

      current.ref.children.push(node);
      current = {
        parent: current,
        ref: node
      }
    };
    p.onattribute = (attr: XMLAttr) => {
      // console.dir(attr);
    };
    p.onclosetag = (node: string) => {
      // opened a tag.  node has "name" and "attributes"
      // console.log("close %s", node);
      if (!current) {
        console.error("current null");
        process.exit(1);
      }
      current = current.parent ? current.parent : {
        ref: ret
      };
    };
    p.onend = () => {
      // console.log("end");
      // parser stream is done, and ready to have more stuff written to it.
      resolve(ret);
    };
    p.write(val).close();
  });
};
