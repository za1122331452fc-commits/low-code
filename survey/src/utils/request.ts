// utils/request.ts
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,  //请求发起时 用户输入
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig  //请求拦截器中 内部处理
} from 'axios'
import { ElMessage } from 'element-plus'
// ============ 类型定义 ============
import type { BaseResponse, RequestConfig } from '@/types'

// ============ 取消重复请求 ============
class RequestCancel {
  private pendingMap = new Map<string, AbortController>()

  /** 生成请求唯一标识 */
  private generateKey(config: AxiosRequestConfig): string {
    const { method, url, params, data } = config
    return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&')
  }

  /** 添加 pending 请求 */
  addPending(config: AxiosRequestConfig): void {
    const key = this.generateKey(config)
    const controller = new AbortController()
    config.signal = controller.signal
    this.pendingMap.set(key, controller)
  }

  /** 移除 pending 请求 */
  removePending(config: AxiosRequestConfig): void {
    const key = this.generateKey(config)
    const controller = this.pendingMap.get(key)
    if (controller) {
      controller.abort()
      this.pendingMap.delete(key)
    }
  }

  /** 取消所有 pending 请求 */
  cancelAll(): void {
    this.pendingMap.forEach((controller) => {
      controller.abort()
    })
    this.pendingMap.clear()
  }
}

// ============ 请求类 ============
class Request {
  private instance: AxiosInstance
  private cancelManager: RequestCancel

  constructor() {
    this.cancelManager = new RequestCancel()

    this.instance = axios.create({
      // baseURL: '/api', 
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupRequestInterceptor()
    this.setupResponseInterceptor()
  }

  // ============ 请求拦截器 ============
  private setupRequestInterceptor(): void {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const { cancelRepeat = true, withToken = true } = config as RequestConfig

        if (cancelRepeat) {
          this.cancelManager.removePending(config)
          this.cancelManager.addPending(config)
        }

        if (withToken) {
          const token = localStorage.getItem('token')
          if (token) {
            config.headers.authorization = `Bearer ${token}`
          }
        }
        return config
      },
      (error: AxiosError) => {
        return Promise.reject(error)
      }
    )
  }

  // ============ 响应拦截器 ============
  private setupResponseInterceptor(): void {
    this.instance.interceptors.response.use(
      (response: AxiosResponse<BaseResponse>) => {
        this.cancelManager.removePending(response.config)

        const { code, msg } = response.data

        if (code === 401) {
          // 清除失效 token，避免登录页仍带着旧 token 反复请求造成刷新循环
          localStorage.removeItem('token')
          ElMessage.error('登录已过期，请重新登录')
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          return Promise.reject(new Error('登录已过期'))
        }

        if (code === 0 || code === 200) {
          const authHeader = response.headers.authorization || response.headers.Authorization || ''
          if (authHeader) {
            localStorage.setItem('token', authHeader)
          }
          return response
        }

        const { showError = true } = response.config as RequestConfig
        if (showError) {
          ElMessage.error(msg || '请求失败')
        }
        return Promise.reject(new Error(msg || '请求失败'))
      },

      (error: AxiosError) => {
        if (axios.isCancel(error)) {
          console.log('请求已取消:', error.message)
          return Promise.reject(error)
        }

        const { showError = true } = error.config as RequestConfig
        if (showError) {
          this.handleError(error)
        }

        return Promise.reject(error)
      }
    )
  }

  // ============ 错误处理 ============
  private handleError(error: AxiosError): void {
    const { response } = error

    if (!response) {
      ElMessage.error('网络异常，请检查网络连接')
      return
    }

    const status = response.status
    const statusMap: Record<number, string> = {
      400: '请求参数错误',
      401: '未授权，请重新登录',
      403: '拒绝访问',
      404: '请求资源不存在',
      405: '请求方法不允许',
      408: '请求超时',
      500: '服务器内部错误',
      501: '服务未实现',
      502: '网关错误',
      503: '服务不可用',
      504: '网关超时'
    }

    const message = statusMap[status] || `请求失败 (${status})`
    ElMessage.error(message)
  }

  // ============ 公开方法 ============

  // T 是请求体类型
  public request<T>(config: RequestConfig): Promise<T> {
    return this.instance.request<unknown, AxiosResponse<BaseResponse<T>>>(config)
      .then((response) => response.data.data)
  }
  public get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url })
  }

  public post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data })
  }

  public put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data })
  }

  public delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url })
  }

  public patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data })
  }

  /** 取消所有正在进行的请求 */
  public cancelAllRequests(): void {
    this.cancelManager.cancelAll()
  }
}

// ============ 导出 ============
export const request = new Request()

export const get = <T>(url: string, config?: RequestConfig): Promise<T> =>
  request.get<T>(url, config)

export const post = <T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> =>
  request.post<T>(url, data, config)

export const put = <T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> =>
  request.put<T>(url, data, config)

export const del = <T>(url: string, config?: RequestConfig): Promise<T> =>
  request.delete<T>(url, config)

//部分更新
export const patch = <T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> =>
  request.patch<T>(url, data, config)