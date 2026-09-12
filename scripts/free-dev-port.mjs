#!/usr/bin/env node
/**
 * Free the Vite dev-server port before `dev` / test scripts run.
 *
 * Deliberately narrow: only the given TCP port, and only when the process
 * holding it is Node. An earlier version of these scripts killed whatever
 * owned ports 3000 or 3006, which could terminate an unrelated app on a
 * shared machine.
 *
 * Windows-only (netstat / tasklist / taskkill). Exits 0 on other platforms so
 * CI and macOS/Linux contributors are unaffected.
 */
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const PORT = Number(process.env.PDF_TOOL_PORT ?? 3000);

/**
 * Parse `netstat -ano` output and return the PIDs listening on `port`.
 *
 * Note: `netstat -ano` must NOT be narrowed with `-p tcp`, because that only
 * lists IPv4 sockets. Vite binds `localhost`, which on many Windows machines
 * resolves to IPv6 `::1`, and an IPv4-only scan silently misses it.
 *
 * @param {string} output raw netstat output
 * @param {number} port TCP port to match
 * @returns {string[]} listening PIDs
 */
export function parseListeningPids(output, port) {
  const pids = new Set();

  for (const line of output.split(/\r?\n/)) {
    const cols = line.trim().split(/\s+/);
    if (cols.length < 5) continue;

    const [proto, local, , state, pid] = cols;
    if (proto.toUpperCase() !== "TCP") continue;
    if (state.toUpperCase() !== "LISTENING") continue;
    if (!local.endsWith(":" + port)) continue;
    if (/^\d+$/.test(pid)) pids.add(pid);
  }

  return [...pids];
}

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

function imageName(pid) {
  const out = run("tasklist", ["/FI", "PID eq " + pid, "/FO", "CSV", "/NH"]);
  const match = out.match(/^"([^"]+)"/m);
  return match ? match[1].toLowerCase() : "";
}

function main() {
  if (process.platform !== "win32") {
    process.exit(0);
  }

  let stopped = 0;

  for (const pid of parseListeningPids(run("netstat", ["-ano"]), PORT)) {
    const name = imageName(pid);

    if (name !== "node.exe") {
      console.log(
        "[free-dev-port] port " + PORT + " is held by " + (name || "an unknown process") +
        " (pid " + pid + ") - leaving it alone"
      );
      continue;
    }

    run("taskkill", ["/PID", pid, "/F"]);
    console.log("[free-dev-port] stopped stale node dev server on port " + PORT + " (pid " + pid + ")");
    stopped += 1;
  }

  if (stopped === 0) {
    console.log("[free-dev-port] port " + PORT + " is free");
  }

  process.exit(0);
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main();
}
