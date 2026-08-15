// 请求类型
import type {AxiosRequestConfig} from 'axios'

// 请求基本配置类型
export interface RequestConfig extends AxiosRequestConfig {
  /** 是否显示 loading */
  loading?: boolean
  /** 是否显示错误提示 */
  showError?: boolean
  /** 是否取消重复请求 */
  cancelRepeat?: boolean
  /** 是否携带 token */
  withToken?: boolean
}

// 登录
export type loginRequest = {
    loginId: string,
    loginPwd: string,
    captcha:string,

    remember?:number,
}

// 注册
export type registRequest={
  loginId:string,
  loginPwd:string
}