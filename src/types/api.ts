export interface BaseResponse<T> {
  message?: string | null
  status: boolean
  error?: string | null
  data?: T | null
}

export interface PaginationInfo {
  totalCount: number
  rowCount: number
  currentPage: number
  totalPage: number
}

export interface PaginatedResponse<T> {
  data: T[]
  setting: PaginationInfo
}
