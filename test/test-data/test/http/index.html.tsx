import { APIOptions } from "core";
import { Request, Response } from "@miqro/core";

export const apiOptions: APIOptions = {
  path: ["/", "/index.html"],
  method: ["GET"]
};

export default (req: Request | null, res: Response | null) => {
  return <html>
    <head></head>
    <body>
      <h1>hello world!</h1>
    </body>
  </html>;
}