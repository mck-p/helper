import { server as HTTPPort } from "@app/ports/http";

const main = async () => {
  HTTPPort.listen(5000, () => {
    console.log("Started");
  });
};

main();
