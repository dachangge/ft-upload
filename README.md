### FT-UPLOADER-HELPER

> 帮助你在 不同的环境上传文件.
> 目标是 富通的 全平台下， 一行代码实现 文件 的 上传、 取消，目前还需要后台 统一上传接口

#### 安装方法：
```
  npm install ft-upload-helper -S 
```

### 使用方法

```
import UploadHelper from 'ft-upload-helper'
const uploadHelper = new UploadHelper({ 
  params: { type: 13 }, 
  progressFn: this.uploadProgress.bind(this),
  partSize: 5
});

// 单个上传
uploadHelper.submit(file);

// 先添加进队列  继发上传
uploadHelper.add(file1)
uploadHelper.add(file2)
... 
uploadHelper.add(file3)
uploadHelper.submitAll()

// 取消上传
uploadHelper.abort()

// 清除所有文件
uploadHelper.clearAllFiles()

// 获取所有文件
uploadHelper.getFileList()
```

### 构造方法参数说明

| 参数 | 含义 | 默认值 |
| --- | --- | --- |
| version | 运行环境 | 默认 alicloud, 可选 alicloud, huaweicloud, 也可通过 VUE_APP_version设置 |
| progressFn| 上传进度 回调函数 | --，注意 绑定 this|
| params| 请求参数 | -- |
| partSize| 分片大小， 单位 Mb | 10 |

### UploadHelper 实例属性

| 属性 | 含义 |
| --- | --- |
| client | obs | oss 的实例对象 |
| canceledUidList | 取消上传的文件uid的数组 |
| upliadFiles| 已经上传的文件的 Map <file, cancelFn> |

### UploadHelper 实例方法

| 方法名 | 作用 | 参数 |
| --- | --- | --- |
| submit | 上传文件 | file: File 需要上传的文件对象 |
| abort | 取消上传 | file:File 取消上传的文件对象 |
| add | 添加文件到上传队列 | file:File 需要上传的文件对象 |
| submitAll | 批量上传（目前只支持继发上传， 考虑做继发） | files:Array<File> | undefined | undefined 上传的文件列表,不传则取 add方法添加的文件 |
| clearAllFiles | 清除所有文件 | -- |
| getFileList | 获取所有的文件列表 | --|



