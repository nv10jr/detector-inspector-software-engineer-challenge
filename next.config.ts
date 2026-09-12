import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // canvas (a native addon, pulled in via chartjs-node-canvas) resolves its
  // platform binary through a dynamic require the bundler can't analyze
  // statically ("Cannot find module as expression is too dynamic"). Keeping
  // both packages external makes Next.js require() them at runtime from
  // node_modules instead of trying to bundle them.
  serverExternalPackages: ["canvas", "chartjs-node-canvas"],
};

export default nextConfig;
