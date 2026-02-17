// src/utils/pagination.utils.ts
import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const parsePagination = (
  query: any,
  defaultSort = 'createdAt',
  allowedSortFields: string[] = ['createdAt', 'name', 'updatedAt']
): PaginationParams => {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 10));
  const offset = (page - 1) * limit;

  let sortBy = (query.sortBy as string) || defaultSort;
  if (!allowedSortFields.includes(sortBy)) {
    sortBy = defaultSort;
  }

  let sortOrder: 'ASC' | 'DESC' = 'DESC';
  if (query.sortOrder && ['ASC', 'DESC', 'asc', 'desc'].includes(query.sortOrder as string)) {
    sortOrder = (query.sortOrder as string).toUpperCase() as 'ASC' | 'DESC';
  }

  return { page, limit, offset, sortBy, sortOrder };
};

export const buildPaginationMeta = (
  totalItems: number,
  page: number,
  limit: number
): PaginationMeta => {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};