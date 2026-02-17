// src/utils/ApiResponse.ts
export class ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  meta?: any;

  constructor(
    statusCode: number,
    message: string,
    data: T | null = null,
    meta?: any
  ) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (meta) {
      this.meta = meta;
    }
  }

  static success<T>(data: T, message = 'Success', statusCode = 200, meta?: any) {
    return new ApiResponse(statusCode, message, data, meta);
  }

  static created<T>(data: T, message = 'Created successfully') {
    return new ApiResponse(201, message, data);
  }

  static noContent(message = 'Deleted successfully') {
    return new ApiResponse(200, message, null);
  }

  static error(message: string, statusCode = 500, data: any = null) {
    return new ApiResponse(statusCode, message, data);
  }
}