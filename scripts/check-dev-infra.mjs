import { spawnSync } from "node:child_process";

function commandStatus(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: process.platform === "win32"
  });

  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim()
  };
}

const checks = [
  {
    label: "Docker",
    required: true,
    status: commandStatus("docker", ["--version"])
  },
  {
    label: "Docker Compose",
    required: true,
    status: commandStatus("docker", ["compose", "version"])
  },
  {
    label: "PostgreSQL readiness CLI",
    required: false,
    status: commandStatus("pg_isready", ["--version"])
  }
];

let failed = false;

for (const check of checks) {
  const state = check.status.ok ? "ok" : check.required ? "missing" : "optional-missing";
  console.log(`${check.label}: ${state}`);

  if (check.status.output) {
    console.log(check.status.output);
  }

  if (check.required && !check.status.ok) {
    failed = true;
  }
}

if (failed) {
  console.error(
    "HomeFlix dev infra requires Docker with Compose to run PostgreSQL and Directus locally."
  );
  process.exit(1);
}
