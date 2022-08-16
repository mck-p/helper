import { server as HTTPPort } from "@app/ports/http";
import Log from "@app/shared/log";
import { port } from "@app/shared/env";

const main = async () => {
  HTTPPort.listen(port, () => {
    Log.trace({ port }, "Listening");
  });
};

main();
