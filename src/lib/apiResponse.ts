import { NextResponse } from "next/server";

export function apiError(message: string, status = 500, code?: string) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: code || "API_ERROR",
    },
    { status }
  );
}

export function apiSuccess<T extends Record<string, unknown>>(payload: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...payload,
    },
    { status }
  );
}
