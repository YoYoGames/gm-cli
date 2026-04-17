/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** GameDevGameEngineResponse */
export interface GameDevGameEngineResponse {
  /** @example "a93a8eb6-df58-4551-b30e-2a1c56d9071d" */
  gameEngineId: string;
  /**
   * Title of the game engine in the default locale
   * @example "Game Engine"
   */
  title: string;
  /** Game engine url for the default locale */
  url: string;
  /**
   * Unique alias for this game engine
   * @example "surreal-engine"
   */
  alias: string;
  /** True if this is the default game engine */
  isDefault?: boolean;
}

/** Pagination info */
export interface PaginationResponse {
  /**
   * @format int32
   * @example 3
   */
  currPage?: number;
  /**
   * @format int32
   * @example 10
   */
  numPerPage?: number;
  /**
   * @format int32
   * @example 4
   */
  totalPages?: number;
  /**
   * @format int64
   * @example 37
   */
  totalItems?: number;
}

/** Response<GameDevGameResponse> */
export interface ResponseGameDevGameResponse {
  data: GameDevGameResponse;
  errors: ErrorResponse[];
}

/** GameDevStudioResponse */
export interface GameDevStudioResponse {
  /** @example "27c388f9-2b67-4b71-8632-f3e80a6d257b" */
  studioId: string;
  /** @example "Google Studia" */
  name: string;
  /** @example "Small indie company" */
  longDescription: string;
  /**
   * Notes: *Game maximum size in megabytes*
   * @format int64
   * @example 200
   */
  gameMaxSize: number;
  /** @example "small@indie.com" */
  contactEmail: string;
  /**
   * @format date-time
   * @example "2023-07-13T05:22:33.536Z"
   */
  creationDate: string;
  members: GameDevUserResponse[];
}

/** GameDevCreateGameRequest */
export interface GameDevCreateGameRequest {
  /**
   * UI string in the default language, defines the name of the new game.
   * @example "Strait Freighter 6"
   */
  name: string;
  /**
   * Studio ID for the studio to which the user is adding the game.
   * @example "a123456-b123-c123-d123-abc123456789"
   */
  studioId: string;
  /**
   * Alias of the game engine used by this game. If no engine is specified, the game will use the default one.
   * @example "ren-py"
   */
  gameEngine?: string | null;
}

/** Response<GameDevUserResponse> */
export interface ResponseGameDevUserResponse {
  data: GameDevUserResponse;
  errors: ErrorResponse[];
}

/** GameDevGameResponse */
export interface GameDevGameResponse {
  /** @example "123e4567-e89b-12d3-a456-426655440000" */
  gameId: string;
  /** @example "Trekking 8" */
  title: string;
  /** @example "https://gmx.dev/game/YYDUNGEON?track=publictrackid" */
  publicShareUrl: string;
  /** @example "https://gmx.dev/game/YYDUNGEON?track=internaltrackid" */
  internalShareUrl: string;
  /** @example "https://dc.gmx.dev/home/games/game/123e4567-e89b-12d3-a456-426655440000/edit" */
  editUrl: string;
  studio: GameDevStudioResponse;
  /** @example "1.2.3.4" */
  version: string;
  gameEngine: GameDevGameEngineResponse;
}

/** ErrorResponse */
export interface ErrorResponse {
  code: string;
  details?: ErrorResponseDetails;
}

/** GameDevStudiosResponse */
export interface GameDevStudiosResponse {
  studios: GameDevStudioResponse[];
  pagination: PaginationResponse;
}

/** GameDevGamesResponse */
export interface GameDevGamesResponse {
  games: GameDevGameResponse[];
  pagination: PaginationResponse;
}

/** Response<GameDevStudiosResponse> */
export interface ResponseGameDevStudiosResponse {
  data: GameDevStudiosResponse;
  errors: ErrorResponse[];
}

/** Response<GameDevGamesResponse> */
export interface ResponseGameDevGamesResponse {
  data: GameDevGamesResponse;
  errors: ErrorResponse[];
}

/** SettingKey */
export interface SettingKey {
  type?: "STRING" | "INTEGER" | "BOOLEAN" | "GRAPHIC";
  defaultValue?: string;
}

/** ErrorResponse.Details */
export interface ErrorResponseDetails {
  settingKey: SettingKey;
  settingId: string;
  fieldName: string;
  parameterName: string;
  message: string;
}

/** GameDevUserResponse */
export interface GameDevUserResponse {
  /** @example "3f971b2f-9210-46c7-b688-03a5002bef9c" */
  userId: string;
  /** @example "genevieve_clam" */
  username: string;
  /** @example "https://play.gmx.dev/users/123-ab-45-cde-6789?q1w23er45tyyui" */
  pictureUrl: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<
  D extends unknown,
  E extends unknown = unknown,
> extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<T> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data.data;
    });
  };
}

/**
 * @title Public REST API
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  gamedev = {
    /**
     * No description
     *
     * @tags GameDevGamesController
     * @name GetUserGames
     * @summary Get a list of all games for the current user.
     * @request GET:/gamedev/games
     * @secure
     */
    getUserGames: (
      query?: {
        /**
         * Studio ID to filter by. Can be used multiple times, or be a comma-separated list
         *
         * Also supports the name `studio-id`
         */
        studioId?: string[];
        /**
         * Game engine alias to filter by. Can be used multiple times, or be a comma-separated list
         *
         * Also supports the name `game-engine`
         */
        gameEngine?: string[];
        /**
         * The page to return. The response will contain games in the range `[page * pageSize, (page + 1) * pageSize]`.
         * @format int32
         * @default 0
         */
        page?: number;
        /**
         * The (maximum) number of games to include in the response. Fewer games may be included if this is the last page.
         *
         * Also supports the name `page-size`
         * @format int32
         * @default 25
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ResponseGameDevGamesResponse, void>({
        path: `/gamedev/games`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags GameDevGamesController
     * @name CreateGame
     * @summary Register a new game on behalf of the current user.
     * @request POST:/gamedev/games
     * @secure
     */
    createGame: (data: GameDevCreateGameRequest, params: RequestParams = {}) =>
      this.request<ResponseGameDevGameResponse, void>({
        path: `/gamedev/games`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags GameDevController
     * @name GetProfile
     * @summary Returns the profile of the current user. If the user is not found in our db, a new one is created.
     * @request GET:/gamedev/profile
     * @secure
     */
    getProfile: (params: RequestParams = {}) =>
      this.request<ResponseGameDevUserResponse, any>({
        path: `/gamedev/profile`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags GameDevGamesController
     * @name UploadGameBundle
     * @summary Upload a new game build on behalf of the current user.
     * @request POST:/gamedev/games/{game-id}/bundles
     * @secure
     */
    uploadGameBundle: (
      gameId: string,
      query: {
        /**
         * Version using format X.Y.Z.B
         * @example "0.1.2.345"
         */
        version: string;
      },
      data: {
        /** @format binary */
        file?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<ResponseGameDevGameResponse, void>({
        path: `/gamedev/games/${gameId}/bundles`,
        method: "POST",
        query: query,
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags GameDevController
     * @name GetUserStudios
     * @summary Returns all studios of which the current user is a member.If the user is not found in our db, a new one is created.
     * @request GET:/gamedev/studios
     * @secure
     */
    getUserStudios: (
      query?: {
        /**
         * The page to return. The response will contain studios in the range `[page * pageSize, (page + 1) * pageSize]`.
         * @format int32
         * @default 0
         */
        page?: number;
        /**
         * The (maximum) number of studios to include in the response. Fewer studios may be included if this is the last page.
         *
         * Also supports the name `page-size`
         * @format int32
         * @default 25
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ResponseGameDevStudiosResponse, void>({
        path: `/gamedev/studios`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
