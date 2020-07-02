import axios, { AxiosResponse, AxiosRequestConfig } from 'axios'

axios.interceptors.response.use((res:AxiosResponse<any>) => {
  if (res.status === 200) {
    if (res.data.success)
      return res.data;
    return Promise.reject(res.data);
  }
  return Promise.reject({
    data: res.data,
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
    config: res.config,
  })
}, (err:any) => {
  console.log(err);
  return err;
})
axios.interceptors.request.use((req: AxiosRequestConfig) => {
  // console.log(req);
  if (!req.withCredentials && req.withCredentials !== false) {
    req.withCredentials = true;
  }
  return req;
})

export { axios };
