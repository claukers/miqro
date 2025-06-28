import { CORS, JSONParser, ReadBuffer, SessionHandler, TextParser, URLEncodedParser } from "@miqro/core";

export const middleware = Object.freeze({
  buffer: ReadBuffer,
  url: URLEncodedParser,
  json: JSONParser,
  text: TextParser,
  cors: CORS,
  session: SessionHandler
});
