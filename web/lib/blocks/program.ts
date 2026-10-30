import {
  generatePortugol,
  type SerializedWorkspace,
} from "@/lib/blocks/portugol-generator";

// Upper bound on a stored Blockly workspace, as serialized JSON.
const MAX_WORKSPACE_BYTES = 200_000;

/**
 * The Portugol program for a block workspace sent by the client. Server
 * actions call this instead of trusting client code, so what the judge runs
 * is always derived from the blocks. Throws on a malformed, oversized or
 * incomplete workspace.
 */
export function blocksProgram(workspace: unknown): string {
  if (typeof workspace !== "object" || workspace === null) {
    throw new Error("Invalid block program.");
  }
  if (JSON.stringify(workspace).length > MAX_WORKSPACE_BYTES) {
    throw new Error("The block program is too large.");
  }
  const { code, errors } = generatePortugol(workspace as SerializedWorkspace);
  if (errors.length > 0) {
    throw new Error("The blocks are incomplete. Check the code panel.");
  }
  return code;
}
