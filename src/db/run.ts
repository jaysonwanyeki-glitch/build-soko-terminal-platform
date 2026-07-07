import { runSeed } from "./seed";
import { pool } from "./index";

runSeed()
  .then(() => pool.end())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
