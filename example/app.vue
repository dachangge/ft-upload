<template>
  <div>
    <el-upload
      ref="upload"
      action=""
      :data="{}"
      :on-success="handleAvatarSuccess"
      :on-change="onChange"
      :on-progress="uploadProgress"
      :auto-upload="false">
      <el-button size="small" type="primary">点击上传</el-button>
    </el-upload>
    <el-button size="small" @click="uploadAll">批量提交</el-button>
    <el-button size="small" @click="cancel">取消</el-button>
    <el-button size="small" @click="cancelAll">取消全部</el-button>
    <el-button size="small" @click="getFiles">文件列表信息</el-button>
  </div>
</template>
<script>
// const UploadHelper = require('./../dist/uploadhelper.min.common')
import UploadHelper from 'UploadHelper'
import axios from 'axios'
export default {
  name: 'example',
  data() {
    return {
      uploadHelper: null
    }
  },
  created() {
    if (process.env.VUE_APP_version === 'alicloud') {
      axios.post('https://r2.rdc.joinf.com/api/a/operator/switch', {"lid":"33023","cid":"33023"}, {
          // 单独配置
          withCredentials: true
        }).then(res => {
        axios.get('https://r2.rdc.joinf.com/api/a/operator/login').then(() => {
        })
      })
    } else {
      axios.post('https://api-gateway.rdc.joinf.com/a/operator/switch', {"lid":"33022","cid":"33022"}, {
          // 单独配置
          withCredentials: true
        }).then(res => {
        axios.get('https://api-gateway.rdc.joinf.com/a/operator/login').then(() => {
        })
      })
    }
  },
  mounted() {
    // console.log(process.env.VUE_APP_version);
    this.uploadHelper = new UploadHelper({ 
      params: { type: 13 }, 
      progressFn: this.uploadProgress.bind(this),
      partSize: 5,
      baseUrl: 'https://trade.joinf.com/rapi',
    });
  },
  methods: {
    // 上传成功
    handleAvatarSuccess(res, file) {
      console.log('res: ', res);
      console.log('file: ', file);
      
    },
    // 上传进度
    uploadProgress(event, file) {
      console.log('uploadProgress:', arguments)
    },
    onChange(file) {
      this.uploadHelper.submit(file).then(res => {
        console.error(res);
      }).catch((err) => {
        debugger
        console.log(err)
      });
    },
    uploadAll() {
      console.log(this.$refs.upload.uploadFiles);
      // this.uploadHelper.submitAll(this.$refs.upload.uploadFiles)
      this.uploadHelper.submitAll()
    },
    cancel() {
      this.uploadHelper.abort(this.$refs.upload.uploadFiles[0]);
    },
    cancelAll() {
      console.log(this.uploadHelper)
      this.uploadHelper.clearAllFiles();
    },
    getFiles() {
      console.log(this.uploadHelper.getFileList());
    }
  }
}
</script>