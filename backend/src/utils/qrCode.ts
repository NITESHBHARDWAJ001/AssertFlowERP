import QRCode from "qrcode";

// Encodes a small JSON payload identifying the asset; returns a base64 data
// URI so it can be stored directly on the record with no extra file storage.
export async function generateAssetQrCode(organizationId: string, assetId: string, assetTag: string): Promise<string> {
  const payload = JSON.stringify({ organizationId, assetId, assetTag });
  return QRCode.toDataURL(payload, { margin: 1, width: 256 });
}
