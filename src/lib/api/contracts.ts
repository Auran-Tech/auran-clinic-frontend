export type BaseResponse<T> = {
  message: string;
  status: boolean;
  error?: string | null;
  data?: T | null;
};

export type PaginationInfo = {
  totalCount: number;
  rowCount: number;
  currentPage: number;
  totalPage: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  setting: PaginationInfo;
};
