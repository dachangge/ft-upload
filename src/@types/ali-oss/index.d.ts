declare module 'ali-oss' {
  class Oss {
    constructor(config?: any);
    cancel():void;
    multipartUpload(path: string, file: any, option: any):Promise<any>;
  }
  export = Oss;
}