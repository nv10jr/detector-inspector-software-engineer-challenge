import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // canvas (a native addon, pulled in via chartjs-node-canvas) resolves its
  // platform binary through a dynamic require the bundler can't analyze
  // statically ("Cannot find module as expression is too dynamic"). Keeping
  // both packages external makes Next.js require() them at runtime from
  // node_modules instead of trying to bundle them.
  serverExternalPackages: ["canvas", "chartjs-node-canvas"],

  // serverExternalPackages above stops the bundler from touching canvas, but
  // on a serverless deploy (Vercel) Next's own file tracer separately has to
  // find every file the route needs at runtime and ship it in the function
  // bundle. It can't statically discover canvas's compiled .node binary
  // (same dynamic-require problem as above), so without this the deployed
  // function is missing it entirely -> "Cannot find module 'canvas'" at
  // request time, even though the build itself succeeds.
  outputFileTracingIncludes: {
    "/api/generate": ["./node_modules/canvas/**/*"],
  },
};

export default nextConfig;
