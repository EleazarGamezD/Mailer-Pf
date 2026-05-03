declare module 'minio' {
  export interface ClientOptions {
    endPoint: string;
    port?: number;
    useSSL?: boolean;
    accessKey?: string;
    secretKey?: string;
    region?: string;
  }

  export class Client {
    constructor(options: ClientOptions);
    putObject(
      bucketName: string,
      objectName: string,
      stream: Buffer,
      size?: number,
      metaData?: Record<string, string>,
    ): Promise<void>;
    statObject(bucketName: string, objectName: string): Promise<void>;
    presignedGetObject(
      bucketName: string,
      objectName: string,
      expiry?: number,
      reqParams?: Record<string, string>,
    ): Promise<string>;
    removeObject(bucketName: string, objectName: string): Promise<void>;
  }
}
