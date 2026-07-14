import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const registryPath = new URL("../projects.json", import.meta.url);
const schemaPath = new URL("../schema/projects.schema.json", import.meta.url);
const [registry, schema] = await Promise.all([registryPath, schemaPath].map(async (url) => JSON.parse(await readFile(url, "utf8"))));
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);
const errors = [];
if (!validate(registry)) errors.push(...validate.errors.map((error) => `${error.instancePath || "/"} ${error.message}`));
const seen = new Set();
for (const [index, project] of registry.projects.entries()) {
  if (seen.has(project.id)) errors.push(`/projects/${index}/id duplicates “${project.id}”`);
  seen.add(project.id);
}
const projectSortKey = (project) => [project.name.toLowerCase(), project.id];
const sortedProjects = [...registry.projects].sort((left, right) => {
  const [leftName, leftId] = projectSortKey(left);
  const [rightName, rightId] = projectSortKey(right);
  if (leftName < rightName) return -1;
  if (leftName > rightName) return 1;
  return leftId.localeCompare(rightId);
});
for (const [index, project] of registry.projects.entries()) {
  if (project.id !== sortedProjects[index].id) {
    errors.push(`/projects must be sorted alphabetically by name; “${project.name}” is out of order`);
    break;
  }
}
if (errors.length) {
  console.error("Project registry is invalid:\n" + errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}
console.log(`Validated ${registry.projects.length} project${registry.projects.length === 1 ? "" : "s"}.`);
