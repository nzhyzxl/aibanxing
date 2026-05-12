import OSS from 'ali-oss'

export function createOSSClient() {
  return new OSS({
    region: process.env.OSS_REGION!,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
    bucket: process.env.OSS_BUCKET!,
  })
}

export async function uploadToOSS(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const client = createOSSClient()
  const key = `uploads/${Date.now()}-${filename}`
  await client.put(key, buffer, {
    headers: { 'Content-Type': contentType },
  })
  const rawDomain = process.env.OSS_CDN_DOMAIN!.replace(/\/$/, '')
  const domain = rawDomain.startsWith('http') ? rawDomain : `https://${rawDomain}`
  return `${domain}/${key}`
}
