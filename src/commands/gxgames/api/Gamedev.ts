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

import {
  CreateGameCodeEnum,
  DeleteCoverCodeEnum,
  DeleteGraphicCodeEnum,
  GameDevCoverResponse,
  GameDevCreateGameRequest,
  GameDevGameDetailsResponse,
  GameDevGameResponse,
  GameDevGamesResponse,
  GameDevGraphicResponse,
  GameDevStudiosResponse,
  GameDevUpdateGameRequest,
  GameDevUserResponse,
  GetGameDetailsCodeEnum,
  GetProfileCodeEnum,
  GetUserGamesCodeEnum,
  GetUserStudiosCodeEnum,
  PublishGameCodeEnum,
  UpdateGameCodeEnum,
  UploadCoverCodeEnum,
  UploadCoverParamsAspectRatioEnum,
  UploadCoverParamsCoverTypeEnum,
  UploadGameBundleCodeEnum,
  UploadGraphicCodeEnum,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Gamedev<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags GameDevGamesController
   * @name CreateGame
   * @summary Register a new game on behalf of the current user.
   * @request POST:/gamedev/games
   * @secure
   */
  createGame = (data: GameDevCreateGameRequest, params: RequestParams = {}) =>
    this.request<
      {
        data: GameDevGameResponse;
        errors: null;
      },
      {
        data: null;
        errors: {
          code: CreateGameCodeEnum;
        }[];
      }
    >({
      path: `/gamedev/games`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags GameDevGameCoversController
   * @name DeleteCover
   * @summary Delete a cover for a game.
   * @request DELETE:/gamedev/games/{game-id}/covers/{cover-id}
   * @secure
   */
  deleteCover = (gameId: string, coverId: string, params: RequestParams = {}) =>
    this.request<
      {
        errors: null;
      },
      {
        data: null;
        errors: {
          code: DeleteCoverCodeEnum;
        }[];
      }
    >({
      path: `/gamedev/games/${gameId}/covers/${coverId}`,
      method: "DELETE",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags GameDevGameGraphicsController
   * @name DeleteGraphic
   * @summary Delete a graphic for a game.
   * @request DELETE:/gamedev/games/{game-id}/graphics/{graphic-id}
   * @secure
   */
  deleteGraphic = (
    gameId: string,
    graphicId: string,
    params: RequestParams = {},
  ) =>
    this.request<
      {
        errors: null;
      },
      {
        data: null;
        errors: {
          code: DeleteGraphicCodeEnum;
        }[];
      }
    >({
      path: `/gamedev/games/${gameId}/graphics/${graphicId}`,
      method: "DELETE",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags GameDevGamesController
   * @name GetGameDetails
   * @summary Get detailed information about a game, including all fields required for publishing.
   * @request GET:/gamedev/games/{game-id}
   * @secure
   */
  getGameDetails = (gameId: string, params: RequestParams = {}) =>
    this.request<
      {
        data: GameDevGameDetailsResponse;
        errors: null;
      },
      {
        data: null;
        errors: {
          code: GetGameDetailsCodeEnum;
        }[];
      }
    >({
      path: `/gamedev/games/${gameId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags GameDevController
   * @name GetProfile
   * @summary Returns the profile of the current user. If the user is not found in our db, a new one is created.
   * @request GET:/gamedev/profile
   * @secure
   */
  getProfile = (params: RequestParams = {}) =>
    this.request<
      {
        data: GameDevUserResponse;
        errors: null;
      },
      {
        data: null;
        errors: {
          code: GetProfileCodeEnum;
        }[];
      }
    >({
      path: `/gamedev/profile`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags GameDevGamesController
   * @name GetUserGames
   * @summary Get a list of all games for the current user.
   * @request GET:/gamedev/games
   * @secure
   */
  getUserGames = (
    query?: {
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
      /**
       * Studio ID to filter by. Can be used multiple times, or be a comma-separated list
       *
       * Also supports the name `studio-id`
       */
      studioId?: string[];
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
        data: GameDevGamesResponse;
        errors: null;
      },
      {
        data: null;
        errors: {
          code: GetUserGamesCodeEnum;
        }[];
      }
    >({
      path: `/gamedev/games`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags GameDevController
   * @name GetUserStudios
   * @summary Returns all studios of which the current user is a member.If the user is not found in our db, a new one is created.
   * @request GET:/gamedev/studios
   * @secure
   */
  getUserStudios = (
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
    this.request<
      {
        data: GameDevStudiosResponse;
        errors: null;
      },
      {
        data: null;
        errors: {
          code: GetUserStudiosCodeEnum;
        }[];
      }
    >({
      path: `/gamedev/studios`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags GameDevGamesController
   * @name PublishGame
   * @summary Publish a game by promoting the internal release track to public and publishing it. Validates all public-track requirements before promotion.
   * @request POST:/gamedev/games/{game-id}/publish
   * @secure
   */
  publishGame = (gameId: string, params: RequestParams = {}) =>
    this.request<
      {
        errors: null;
      },
      {
        data: null;
        errors: {
          code: PublishGameCodeEnum;
        }[];
      }
    >({
      path: `/gamedev/games/${gameId}/publish`,
      method: "POST",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags GameDevGamesController
   * @name UpdateGame
   * @summary Update publication-required properties of a game.
   * @request PATCH:/gamedev/games/{game-id}
   * @secure
   */
  updateGame = (
    gameId: string,
    data: GameDevUpdateGameRequest,
    params: RequestParams = {},
  ) =>
    this.request<
      {
        data: GameDevGameDetailsResponse;
        errors: null;
      },
      {
        data: null;
        errors: {
          code: UpdateGameCodeEnum;
        }[];
      }
    >({
      path: `/gamedev/games/${gameId}`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags GameDevGameCoversController
   * @name UploadCover
   * @summary Upload a cover image for a game.
   * @request POST:/gamedev/games/{game-id}/covers
   * @secure
   */
  uploadCover = (
    gameId: string,
    query: {
      /**
       * Aspect ratio for the cover to upload: can only be 16:9
       *
       * Also supports the name `aspect-ratio`
       */
      aspectRatio: UploadCoverParamsAspectRatioEnum;
      /**
       * Cover media type, defaults to `IMAGE`
       *
       * Also supports the name `cover-type`
       * @default "IMAGE"
       */
      coverType?: UploadCoverParamsCoverTypeEnum;
    },
    data: {
      /** @format binary */
      file?: File;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
        data: GameDevCoverResponse;
        errors: null;
      },
      {
        data: null;
        errors: {
          code: UploadCoverCodeEnum;
        }[];
      }
    >({
      path: `/gamedev/games/${gameId}/covers`,
      method: "POST",
      query: query,
      body: data,
      secure: true,
      type: ContentType.FormData,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags GameDevGamesController
   * @name UploadGameBundle
   * @summary Upload a new game build on behalf of the current user.
   * @request POST:/gamedev/games/{game-id}/bundles
   * @secure
   */
  uploadGameBundle = (
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
    this.request<
      {
        data: GameDevGameResponse;
        errors: null;
      },
      {
        data: null;
        errors: {
          code: UploadGameBundleCodeEnum;
        }[];
      }
    >({
      path: `/gamedev/games/${gameId}/bundles`,
      method: "POST",
      query: query,
      body: data,
      secure: true,
      type: ContentType.FormData,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags GameDevGameGraphicsController
   * @name UploadGraphic
   * @summary Upload a graphic (image or video) for a game.
   * @request POST:/gamedev/games/{game-id}/graphics
   * @secure
   */
  uploadGraphic = (
    gameId: string,
    data: {
      /** @format binary */
      file?: File;
      /** @format binary */
      preview?: File;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
        data: GameDevGraphicResponse;
        errors: null;
      },
      {
        data: null;
        errors: {
          code: UploadGraphicCodeEnum;
        }[];
      }
    >({
      path: `/gamedev/games/${gameId}/graphics`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.FormData,
      format: "json",
      ...params,
    });
}
