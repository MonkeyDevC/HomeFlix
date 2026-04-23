import type {
  PlaybackDetailPayload,
  ProfileListResponse,
  ProfileSummary,
  ServiceStatusResponse
} from "@homeflix/contracts";

type RequestFailure = Readonly<{
  state: "error";
  message: string;
  statusCode?: number;
}>;

type RequestSuccess<TData> = Readonly<{
  state: "ok";
  data: TData;
  statusCode: number;
}>;

type RequestResult<TData> = RequestFailure | RequestSuccess<TData>;

async function requestJson<TData>(url: string): Promise<RequestResult<TData>> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      const message =
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof (body as { error?: unknown }).error === "object" &&
        (body as { error: { message?: unknown } }).error !== null &&
        typeof (body as { error: { message?: unknown } }).error.message === "string"
          ? (body as { error: { message: string } }).error.message
          : `Request failed with status ${response.status}.`;

      return {
        state: "error",
        message,
        statusCode: response.status
      };
    }

    return {
      state: "ok",
      data: body as TData,
      statusCode: response.status
    };
  } catch (error) {
    return {
      state: "error",
      message: error instanceof Error ? error.message : "Request failed."
    };
  }
}

export async function fetchApiStatus(apiBaseUrl: string): Promise<
  | Readonly<{
      state: "ok";
      endpoint: string;
      response: ServiceStatusResponse;
      statusCode: number;
    }>
  | Readonly<{
      state: "error";
      endpoint: string;
      message: string;
      statusCode?: number;
    }>
> {
  const endpoint = `${apiBaseUrl}/api/v1/status`;
  const result = await requestJson<ServiceStatusResponse>(endpoint);

  if (result.state !== "ok") {
    return {
      state: "error",
      endpoint,
      message: result.message,
      ...(result.statusCode === undefined ? {} : { statusCode: result.statusCode })
    };
  }

  return {
    state: "ok",
    endpoint,
    response: result.data,
    statusCode: result.statusCode
  };
}

export async function fetchProfiles(apiBaseUrl: string): Promise<
  | Readonly<{
      state: "ok";
      data: readonly ProfileSummary[];
      statusCode: number;
    }>
  | RequestFailure
> {
  const result = await requestJson<ProfileListResponse>(`${apiBaseUrl}/api/v1/profiles`);

  if (result.state !== "ok") {
    return result;
  }

  if (!result.data.ok) {
    return {
      state: "error",
      message: result.data.error.message,
      statusCode: result.statusCode
    };
  }

  return {
    state: "ok",
    data: result.data.data.profiles,
    statusCode: result.statusCode
  };
}

export async function fetchPlaybackDetail(
  apiBaseUrl: string,
  contentItemSlug: string,
  profileId?: string | null
): Promise<
  | Readonly<{
      state: "ok";
      data: PlaybackDetailPayload;
      statusCode: number;
    }>
  | RequestFailure
> {
  const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : "";
  const endpoint = `${apiBaseUrl}/api/v1/content-items/${encodeURIComponent(contentItemSlug)}/playback${query}`;
  const result = await requestJson<{ ok: boolean; data?: PlaybackDetailPayload; error?: { message?: string } }>(endpoint);

  if (result.state !== "ok") {
    return result;
  }

  if (!result.data.ok || result.data.data === undefined) {
    return {
      state: "error",
      message: result.data.error?.message ?? "Playback detail is not available.",
      statusCode: result.statusCode
    };
  }

  return {
    state: "ok",
    data: result.data.data,
    statusCode: result.statusCode
  };
}
