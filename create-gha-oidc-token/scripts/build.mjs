import esbuild from "esbuild";
import * as glob from "glob";

const entryPoints = glob.sync("./src/*.ts", {
  ignore: ["./src/**/*.d.ts"],
});

// const entryPoints = "./src/**/*.ts";

await esbuild.build({
  bundle: true,
  outdir: "./dist",
  platform: "node",
  logLevel: "info",
  entryPoints,
});
