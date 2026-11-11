export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "REQUEST_FAILED",
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function storageUnavailable(): never {
  throw new ApiError(
    503,
    "Publishing storage is not configured. Your changes have not been saved.",
    "STORAGE_UNAVAILABLE",
  );
}
