import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Every backend test file exercises the real SQL Server instance from
    // docker-compose.yml (no per-file test database) — see
    // docs/tickets/005-candidate-list-endpoint.md. Running test files in
    // parallel workers makes them race on the same `Candidate` table (e.g. a
    // listing test asserting an empty table while another file's create test
    // is mid-flight), so file-level parallelism is disabled. Tests within a
    // single file already run sequentially by default.
    fileParallelism: false,
  },
});
