
/**
 * Interface for pagination parameters
 */
export interface IPaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Interface for pagination response
 */
export interface IPaginationResponse<T> {
    data: T[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

/**
 * Interface for API response wrapper
 */
export interface IApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    code?: string;
}
