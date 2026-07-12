import { prisma } from "../config/prisma";

// Atomically increments the org's sequence counter and formats a tag like
// "AST-00042". Never derived from a client-supplied value.
export async function generateAssetTag(organizationId: string): Promise<string> {
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { assetTagSequence: { increment: 1 } },
    select: { assetTagPrefix: true, assetTagSequence: true },
  });

  return `${org.assetTagPrefix}-${String(org.assetTagSequence).padStart(5, "0")}`;
}
