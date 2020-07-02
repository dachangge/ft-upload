declare module 'obs' {
  class Obs {
    constructor(config:any);
    bucketObj: BucketObj;
    initiateMultipartUpload(bucket: BucketObj):Promise<any>;
    uploadPart(config:any):Promise<any>;
    fail: boolean;
    completeMultipartUpload(options: FullBucket):Promise<any>;
    abortMultipartUpload(bucketObj: BucketObj, callback: (err:any, result: any) => void): void;
  }
  export interface BucketObj {
    Bucket: string,
    Key: string,
    UploadId?: string
  }
  export interface FullBucket extends BucketObj{
    Parts: any[]
  }
  export default Obs;
}