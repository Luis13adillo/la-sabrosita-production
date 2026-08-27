/*
 * Compile the client's Claude Design scene files to plain JS.
 *
 * The scene shipped in StillMenuMotion.zip is JSX. Claude Design compiles it in
 * the browser at load time with @babel/standalone 7.29.0 and the "react" +
 * "typescript" presets. A HyperFrames render must not depend on a CDN or on a
 * compile step happening before the first frame is sampled, so the same Babel
 * build runs here instead, once, and index.html loads plain <script> files.
 *
 * Same Babel version, same presets — the emitted code is what the browser would
 * have produced. Nothing in src/*.jsx is rewritten by this script.
 *
 *   node scripts/build-jsx.mjs
 *
 * Babel itself is not a project dependency: it is downloaded to a scratch path
 * on demand, because it is a build tool and not part of the deliverable.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(HERE, "..");
const SRC = join(PROJECT, "src");
const OUT = join(PROJECT, "build");

const BABEL = process.env.BABEL_STANDALONE;
if (!BABEL || !existsSync(BABEL)) {
  console.error(
    "Set BABEL_STANDALONE to a local copy of @babel/standalone@7.29.0/babel.min.js.\n" +
      "  curl -sSfL -o /tmp/babel.min.js https://unpkg.com/@babel/standalone@7.29.0/babel.min.js"
  );
  process.exit(1);
}

const require = createRequire(import.meta.url);
const vm = require("node:vm");
const sandbox = { self: {}, window: {}, console };
sandbox.self = sandbox;
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync(BABEL, "utf8"), sandbox, { filename: "babel.min.js" });
const Babel = sandbox.Babel;

// Exactly the options the Claude Design loader uses (support.js, x-import).
const PRESETS = ["react", "typescript"];

const FILES = ["animations-v3.jsx", "tweaks-panel.jsx", "sabrosita-scene.jsx"];

mkdirSync(OUT, { recursive: true });

for (const name of FILES) {
  const src = readFileSync(join(SRC, name), "utf8");
  const { code } = Babel.transform(src, { filename: name, presets: PRESETS });
  const outName = name.replace(/\.jsx$/, ".js");
  // The Claude Design loader evaluates each module inside
  //   new Function("React", "module", "exports", "require", code)
  // so top-level declarations stay module-scoped and only the explicit
  // Object.assign(window, …) at the end of each file escapes. Reproduce that
  // scope here — loading the bare output as a classic script would leak every
  // top-level const onto window and let the three files collide.
  const wrapped =
    "(function (React, module, exports, require) {\n" +
    code +
    "\n}).call(this, window.React, { exports: {} }, {}, function () { return {}; });\n";
  // HyperFrames inlines local <script src> into the page before rendering.
  // animations-v3.jsx documents the OM_SCENES contract in a comment that shows
  // a literal </script> tag, and inlined verbatim that closes the script early:
  // the rest of the file lands in the page as visible text and nothing runs.
  // Escaping the slash is inert in JS — identical inside a comment, identical
  // inside a string — and it happens here, in the build output, so the client's
  // source file stays byte-for-byte theirs.
  const safe = wrapped.replace(/<\/script/gi, "<\\/script");
  writeFileSync(join(OUT, outName), safe);
  console.log(`${name} -> build/${outName}  (${wrapped.length} bytes)`);
}
