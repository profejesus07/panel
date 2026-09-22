export interface ListResult<T> {
  data: T[]
  count: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export const DEFAULT_PAGE_SIZE = 20
