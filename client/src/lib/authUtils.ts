export function isUnauthorizedError(error: any): boolean {
  return error?.message?.includes('Unauthorized') || 
         error?.status === 401 || 
         error?.response?.status === 401;
}