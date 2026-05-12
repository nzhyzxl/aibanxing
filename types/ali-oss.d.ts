declare module 'ali-oss' {
  interface OSSOptions {
    region: string
    accessKeyId: string
    accessKeySecret: string
    bucket: string
  }

  interface PutOptions {
    headers?: Record<string, string>
  }

  class OSS {
    constructor(options: OSSOptions)
    put(key: string, buffer: Buffer, options?: PutOptions): Promise<{ url: string; name: string }>
  }

  export default OSS
}
