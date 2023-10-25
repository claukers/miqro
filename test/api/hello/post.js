export default {
  description: "some description",
  request: {
    body: {
      name: "string"
    }
  },
  response: {
    body: {
      status: {
        type: "enum",
        description: "the status of the response",
        enumValues: ["OK", "NOK"]
      },
      text: "string",
      meta: {
        type: "object",
        properties: {
          meta1: "number",
          bla: {
            description: "a map",
            type: "dict",
            dictType: "bla"
          },
          ble: {
            type: "dict",
            dictType: "object",
            properties: {
              attr1: "string",
              attr2: {
                type: "object",
                properties: {
                  bla2: {
                    type: "number",
                    description: "bla2"
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  handler: ctx => ctx.json({ text: `Hello ${ctx.body.name}!` })
}
