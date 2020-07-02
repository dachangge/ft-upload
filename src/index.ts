// const Oss = require('ali-oss')
import Oss from 'ali-oss';
import Obs, { BucketObj } from 'obs'
import { maxSize, middleSize, UploadVersion, UploadConfig, configList, mineTypes } from './config'
import { axios } from './axios'
interface UploadOptions {
  version?: string; // 版本参数
  progressFn: () => void; // 进度对调
  params: any; // 请求参数
  partSize?: number; // 分片大小 单位Mb
  urlConfig?: UploadConfig;
  baseUrl?: string; // 接口域 默认取 process.env.VUE_APP_html_url
}
enum UploadStatus {
  ready = 'ready',
  uploading = 'uploading',
  success = 'success',
  fail = 'fail'
}

class UploadHelper{
  private client: Oss | Obs | undefined;
  // 取消上传的文件uid 集合
  private canceledUidList: number[] = [];
  // 提供默认的阿里环境配置
  private config: UploadConfig = configList.alicloud;
  // 分片大小
  private partSize: number = 10;
  // 上传的文件列表
  private uploadFiles: Map<UploadFile, Function | null> = new Map();
  private progressFn: ((process: number, file: UploadFile) => void);
  params: any;
  constructor(options: UploadOptions) {
    console.log(options, process.env.VUE_APP_version)
    if (!options) {
      throw new Error('UploadHelper构造函数 需要一个 对象参数')
    }
    if (options.urlConfig && Object.prototype.toString.call(options.urlConfig) === '[object Object]') {
      if (!options.urlConfig.directUrl) throw new Error('传入的api参数对象，未提供文件直传所需地址参数 "directUrl"')
      if (!options.urlConfig.secretKeyUrl) throw new Error('传入的api参数对象，未提供大附件上传所需的临时秘钥地址参数 "secretKeyUrl"')
      this.config = options.urlConfig;
    } else {
      this.config = configList[options.version || process.env.VUE_APP_version || 'alicloud'];
    }
    this.config = this.config || configList.alicloud;
    Object.keys(this.config).forEach(key => {
      let url = (this.config as any)[key];
      if (key !== 'version' && url.indexOf('http') !== 0) {
        (this.config as any)[key] = options.baseUrl ? options.baseUrl + url : process.env.VUE_APP_html_url + url
      }
    })
    if (options.partSize && typeof options.partSize === 'number')
      this.partSize = options.partSize;
    this.progressFn =  options.progressFn;
    this.params = options.params
  }
  // 添加文件到上传队列
  add(file: UploadFile | UploadFile[]):void {
    if (Array.isArray(file)) {
      file.forEach(it => {
        it.status = UploadStatus.ready
        this.uploadFiles.set(it, null)
      })
    } else {
      file.status = UploadStatus.ready;
      this.uploadFiles.set(file, null)
    }
  }
  // 单个上传
  async submit(file: UploadFile):Promise<String | void | UploadFile> {
    if (!file) {
      throw new Error('参数必须是 文件类型')
    }
    if (file.size > maxSize) {
      return Promise.reject('文件大小不能超过1G');
    }
    if (!this.uploadFiles.has(file)) {
      this.uploadFiles.set(file, null)
    }
    file.status = UploadStatus.uploading;
    this.params.bucketType = +(file.size > middleSize)
    // 直传
    if (file.size < middleSize) {
        return axios.get(this.config.directUrl, { params: this.params }).then(res => {
          // 阿里直传
          if (this.config.version === UploadVersion.alicloud) {
            // this.elUpload.action = res.data.host;
            let data ={
              name: file.name,
              key: res.data.dir + '/' + file.name,
              policy: res.data.policy,
              OSSAccessKeyId: res.data.accessid,
              signature: res.data.signature,
              callback: res.data.callbackSig,
              expire: res.data.expire,
              ...res.data.callvackVarMap
            }
            return this.derictUpload(res.data.host, data, file)
          }
          // 华为直传
          else if (this.config.version === UploadVersion.huaweicloud) {
            let suffix = file.name.slice(file.name.lastIndexOf('.') + 1);
            // this.elUpload.action = res.data.host;
            
            let data = {
              ...res.data,
              name: file.name,
              'content-type': mineTypes[suffix]
            }
            return this.derictUpload(res.data.host, data, file)
            }
          // TODO 腾讯
          return '';
        })
    // 分片上传
    }
    else {
      return axios.get(this.config.secretKeyUrl, { params: this.params }).then(res => {
        // alicloud 分片
        if (this.config.version  === UploadVersion.alicloud) {
              const ossConfig:any = {
                accessKeyId: res.data.ak,
                accessKeySecret: res.data.sk,
                stsToken: res.data.token,
                bucket: res.data.bucket
              }
              this.client = new Oss(ossConfig);
              let client = this.client
              this.uploadFiles.set(file, this.client.cancel.bind(client))
              return axios.get(this.config.directUrl, { params: this.params }).then(res1 => {
                // console.error(ossRes);
                return this.ossMultipartUpload(file, res.data.callbackUrl, res1.data.dir)
              });
        }
        // huawei 分片
       if(this.config.version === UploadVersion.huaweicloud) {
            // let suffix = file.name.slice(file.name.lastIndexOf('.') + 1);
            this.client = new Obs({
              access_key_id: res.data.ak,
              secret_access_key: res.data.sk,
              security_token: res.data.token,
              server: res.data.endpoint,
              timeout: 60 * 5,
            })
            this.client.bucketObj = {
              Bucket: res.data.bucket,
              Key: res.data.key
            }
            let client = this.client;
            this.uploadFiles.set(file, () => {
              client.abortMultipartUpload(
                client.bucketObj,
                function (err, result) {
                    if (err) {
                            console.log('Error-->' + err);
                    } else {
                            console.log(result)
                    }
              });
              // 当前华为 环境 取消上传回调太慢（有时候上传成功了，才刚返回）， 所以默认 取消上传成功
              this.canceledUidList.push(file.uid)
              this.uploadFiles.delete(file);
            })
            return this.obsMultipartUpload(file, this.client)
        }
      })
      // })
    }
    return Promise.resolve('123')
  }
  // 上传队列 并发
  private concurrenceSubmitAll():Promise<any[]> {
    return Promise.resolve([])
  }
  // 继发
  async secondarySubmitAll(fileList?: UploadFile[]):Promise<any[]> {
    // !fileList && (fileList = Array.from(this.uploadFiles).filter(it => it.status === UploadStatus.ready));
    if (!fileList) {
      fileList = [];
      for(let [key, value] of this.uploadFiles) {
        if (key.status === UploadStatus.ready) {
          fileList.push(key)
        }
      }
    }
    if (!fileList || fileList.length === 0)
      return Promise.reject('当前没有可以上传的文件')
    let files = [];
    for(let file of fileList) {
      if(this.uploadFiles.has(file)){
        await this.submit(file);
        files.push(file)
      }
    }
    return Promise.resolve(files)
  }
  // 上传队列
  submitAll(fileList?: UploadFile[]):Promise<any[]> {
    return this.secondarySubmitAll(fileList);
  }
  // 文件直传
  private derictUpload(host: string, data: any, file: UploadFile):Promise<any> {
      let formData = new FormData();
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      })
      formData.append('file', file.raw, file.raw.name);
      const fn = this.progressFn;
      let that = this;
    return axios({
      url: host,
      method: 'post',
      data: formData,
      withCredentials: false,
      cancelToken: new axios.CancelToken((c) => {
        // executor 函数接收一个 cancel 函数作为参数
        that.uploadFiles.set(file, c);
      }),
      onUploadProgress: function (progressEvent) {
        let percent = 0;
        if (progressEvent.total > 0) {
          percent = Math.floor(progressEvent.loaded / progressEvent.total * 100);
        }
        file.status = UploadStatus.uploading;
        fn(percent, file)
      }
    }).then(res => {
      console.log(res);
      // 触发取消事件
      if (res instanceof axios.Cancel) {
        return '上传任务已经被取消'
      }
      file.status = UploadStatus.success;
      file.response = {
        url: res.data || Reflect.get(res, 'url')
      }
      file.keyCode = Reflect.get(res, 'key')
      fn(100, file);
      return res;
    }).catch(res => {
      file.status = UploadStatus.fail;
      fn(0, file);
      return Promise.reject(res);
    })
  }
  // 取消上传 
  abort(file:UploadFile):Promise<any> {
    let fn = this.uploadFiles.get(file);
    if (fn) {
      fn();
    }
    if (this.uploadFiles.has(file))
      this.uploadFiles.delete(file)
    return Promise.resolve();
  }
  // 清除已经上传的所有文件
  clearAllFiles() {
    Array.from(this.uploadFiles).forEach(([file, cancelFn]) => {
      // 取消当前的上传任务
      if (file.status === UploadStatus.uploading) {
        if (cancelFn)
          cancelFn.call(this);
      }
    });
    // 清空上传文件记录
    this.uploadFiles.clear();
  }
  // oss 分片
  private async ossMultipartUpload (file: UploadFile, callback: string, dir: string): Promise<UploadFile | void> {
    try {
      let result = await (this.client as Oss).multipartUpload(dir + '/' + file.name, file.raw, {
        partSize: this.partSize * 1024 * 1024,
        parallel: 3,
        progress: (percent:number) => this.progressFn(Math.floor(percent * 100), file),
        callback: {
          body: '{"object":${object},"bucket":${bucket},"buckettype":${x:buckettype}}',
          url: callback,
          contentType: 'application/json',
          customValue: {
            buckettype: '1'
          }
        }
      })
      console.log(result);
      file.status = UploadStatus.success;
      file.keyCode=result.data.key;
      file.response = {
        url: result.data.url,
      }
      this.progressFn(100, file);
      return file;
    } catch (e) {
      console.log(e);
      file.status = UploadStatus.fail
      return Promise.reject(e);
    }
  }
  // obs 分片
  private obsMultipartUpload(file:UploadFile, client: Obs):Promise<any> {

    return client.initiateMultipartUpload(client.bucketObj).then(result => {
      if (result.CommonMsg.Status < 300) {
        client.bucketObj.UploadId = result.InterfaceResult.UploadId;
        let uploadId = result.InterfaceResult.UploadId;
        
        console.log('开始上传');
        // 每段上传 10MB
        const partSize = this.partSize * 1024 * 1024;
        const fileSize = file.size;
        const partCount = Math.ceil(fileSize / partSize);
        console.log('文件大小:' + fileSize + ',每段:' + partSize + ',总共:' + partCount);
        let Parts = Object.create(null);
        let Promises = [];
        // 执行并发上传段
        for (let i = 0; i < partCount; i++) {
          // 分段在文件中的起始位置
          let offset = i * partSize;
          // 分段大小
          let currPartSize = (i + 1 === partCount) ? fileSize - offset : partSize;
          // 分段号
          let partNumber = i + 1;
          // let idx = file.name.lastIndexOf('.');
          // 开始上传
          file.status = UploadStatus.uploading;
          Promises.push(this.upload(file, partNumber, currPartSize, offset, client, Parts, partCount));
        }
        this.progressFn(0, file);
        return Promise.all(Promises).then(() => {
          let uploadParts = [];
          for (let j = 0; j <= partCount; j++) {
            const part = Reflect.get(Parts, j)
            if (part) {
              uploadParts.push(part);
            }
          }
          return client.completeMultipartUpload({
            ...client.bucketObj,
            Parts: uploadParts
          }).then(res => {
            if (res.CommonMsg.Status < 300) {
              console.log('complete multipart upload finished.', res);
              if (!this.config.fileResUrl)
                throw new Error('传入的api参数对象，未提供大附件上传华为环境所需的地址回调参数 "fileResUrl"')
              return axios.get(`${this.config.fileResUrl}/${client.bucketObj.Bucket}/${Buffer.from(client.bucketObj.Key + '/' + file.name).toString('base64')}`).then(res => {
                console.log(res);
                file.status = UploadStatus.success;
                file.response = {
                  url: res.data
                }
                file.keyCode = client.bucketObj.Key
                // TODO 上传结束的回调
                this.progressFn(100, file);
                return res
              });
            }
          });
        });
      }
    });
  }
  // 分段上传保存
  private upload(largeFile: UploadFile, partNumber: number, currPartSize: number, offset: number, client:Obs, Parts: Object, total:number) {
    return client.uploadPart({
      ...client.bucketObj,
      PartNumber: partNumber,
      PartSize: currPartSize,
      Offset: offset,
      SourceFile: largeFile.raw,
    }).then((result:any) => {
      // console.log(result, largeFile, this.canceledUidList);
      let isCancel = this.canceledUidList.some(it => it === largeFile.uid);
      if (isCancel) return Promise.reject();
      if (result.CommonMsg.Status < 300) {
        if (client.fail) {
          return Promise.reject();
        }
        let etag = result.InterfaceResult.ETag;
        let e = { PartNumber: partNumber, ETag: etag };
        Reflect.set(Parts, partNumber, e);
        // TODO 上传进度计算
        this.progressFn(Math.floor(100 * (Object.keys(Parts).length / total)), largeFile)
        // console.log('第' + partNumber + '段上传成功etag:' + etag, file);
        // if (Object.keys(Parts).length === total) {
          
        // }
        return Promise.resolve();
      } else {
        // let idx = largeFile.name.lastIndexOf('.');
        largeFile.status = UploadStatus.fail;
        // this.$emit('parseUploadFileData', file)
        this.progressFn(0, largeFile)
        client.fail = true
        return Promise.reject();
      }
    });
  }
  getFileList():UploadFile[] {
    return Array.from(this.uploadFiles).map(([file, fn]) => file);
  }
}

interface UploadFile extends File{
  raw: File;
  status: UploadStatus;
  keyCode: string;
  response: { ['url']: string };
  uid: number;
}

export default UploadHelper;