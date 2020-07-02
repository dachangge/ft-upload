declare class ElUpload {
  action: string;	// 必选参数，上传的地址
  headers: Object;	// 设置上传的请求头部
  data: Object; // 上传时附带的额外参数
  name: string; // 上传的文件字段名
  submit: () => void; // 手动上传文件列表
  abort: () => void; // 取消上传请求
}