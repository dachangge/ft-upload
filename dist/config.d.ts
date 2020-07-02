export declare const maxSize: number;
export declare const middleSize: number;
export declare enum UploadVersion {
    alicloud = 0,
    huaweicloud = 1,
    production = 2
}
export interface UploadConfig {
    version: UploadVersion;
    directUrl: string;
    secretKeyUrl: string;
    fileResUrl?: string;
}
export declare const configList: {
    [propName: string]: UploadConfig;
};
export declare const mineTypes: {
    [propName: string]: string;
};
