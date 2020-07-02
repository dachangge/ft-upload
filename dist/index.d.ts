import { UploadConfig } from './config';
interface UploadOptions {
    version?: string;
    progressFn: () => void;
    params: any;
    partSize?: number;
    urlConfig?: UploadConfig;
    baseUrl?: string;
}
declare enum UploadStatus {
    ready = "ready",
    uploading = "uploading",
    success = "success",
    fail = "fail"
}
declare class UploadHelper {
    private client;
    private canceledUidList;
    private config;
    private partSize;
    private uploadFiles;
    private progressFn;
    params: any;
    constructor(options: UploadOptions);
    add(file: UploadFile | UploadFile[]): void;
    submit(file: UploadFile): Promise<String | void | UploadFile>;
    private concurrenceSubmitAll;
    secondarySubmitAll(fileList?: UploadFile[]): Promise<any[]>;
    submitAll(fileList?: UploadFile[]): Promise<any[]>;
    private derictUpload;
    abort(file: UploadFile): Promise<any>;
    clearAllFiles(): void;
    private ossMultipartUpload;
    private obsMultipartUpload;
    private upload;
    getFileList(): UploadFile[];
}
interface UploadFile extends File {
    raw: File;
    status: UploadStatus;
    keyCode: string;
    response: {
        ['url']: string;
    };
    uid: number;
}
export default UploadHelper;
