// 响应数据的类型

// data数据类型
export type AnyObject = Record<string, unknown>

// 响应数据基本类型
export type BaseResponse<T=AnyObject> = {
    code:number,
    msg:string,
    data:T
}

export interface LoginData {
  id: number
  loginId: string
  name: string
  roleId: number
}

// 登录响应数据类型
export type LoginResponse = BaseResponse<LoginData>