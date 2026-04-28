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

export type CreateGameCodeEnum =
  | "game_creation_not_allowed"
  | "game_name_taken"
  | "game_name_too_long"
  | "invalid_characters_in_name"
  | "invalid_request_payload"
  | "max_games_limit_reached"
  | "sign_in_required"
  | "studio_access_denied"
  | "game_engine_not_found"
  | "no_specific_studio_for_user"
  | "studio_not_found"
  | "internal_server_error"
  | "invalid_studio_ownership";

export type DeleteCoverCodeEnum =
  | "breaking_published_game"
  | "game_access_denied"
  | "cover_not_found"
  | "game_cover_not_found"
  | "game_not_found";

export type DeleteGraphicCodeEnum =
  | "breaking_published_game"
  | "game_access_denied"
  | "asset_not_found"
  | "game_not_found";

/** ErrorResponse */
export interface ErrorResponse {
  code: string;
  details?: ErrorResponseDetails;
}

/** ErrorResponse.Details */
export interface ErrorResponseDetails {
  fieldName: string;
  message: string;
  parameterName: string;
  settingId: string;
  settingKey: SettingKey;
}

/** GameDevCoverResponse */
export interface GameDevCoverResponse {
  aspectRatio: string;
  coverId: string;
  coverUrl: string | null;
  /** Allowed values: `IMAGE`, ` VIDEO` */
  type: string;
}

/** GameDevCreateGameRequest */
export interface GameDevCreateGameRequest {
  /**
   * Alias of the game engine used by this game. If no engine is specified, the game will use the default one.
   * @example "ren-py"
   */
  gameEngine?: string | null;
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
}

/** GameDevGameDetailsResponse */
export interface GameDevGameDetailsResponse {
  ageRating: GameDevGameDetailsResponseAgeRatingEnum;
  covers: GameDevCoverResponse[];
  /** @example "https://dc.gmx.dev/home/games/game/123e4567-e89b-12d3-a456-426655440000/edit" */
  editUrl: string;
  gameEngine: GameDevGameEngineResponse;
  /** @example "123e4567-e89b-12d3-a456-426655440000" */
  gameId: string;
  graphics: GameDevGraphicResponse[];
  /** @example "https://gmx.dev/game/YYDUNGEON?track=internaltrackid" */
  internalShareUrl: string;
  platforms: GameDevGameDetailsResponsePlatformsEnum[];
  /** @example "https://gmx.dev/game/YYDUNGEON?track=publictrackid" */
  publicShareUrl: string;
  shortDescription: string;
  studio: GameDevStudioResponse;
  /** @example "Trekking 8" */
  title: string;
  /** @example "1.2.3.4" */
  version: string;
}

export type GameDevGameDetailsResponseAgeRatingEnum =
  | "NOT_SET"
  | "EVERYONE"
  | "CHILDREN"
  | "EARLY_TEENS"
  | "TEENS"
  | "ADULTS"
  | "MATURE";

export type GameDevGameDetailsResponsePlatformsEnum = "DESKTOP" | "MOBILE";

/** GameDevGameEngineResponse */
export interface GameDevGameEngineResponse {
  /**
   * Unique alias for this game engine
   * @example "surreal-engine"
   */
  alias: string;
  /** @example "a93a8eb6-df58-4551-b30e-2a1c56d9071d" */
  gameEngineId: string;
  /** True if this is the default game engine */
  isDefault?: boolean;
  /**
   * Title of the game engine in the default locale
   * @example "Game Engine"
   */
  title: string;
  /** Game engine url for the default locale */
  url: string;
}

/** GameDevGameResponse */
export interface GameDevGameResponse {
  /** @example "https://dc.gmx.dev/home/games/game/123e4567-e89b-12d3-a456-426655440000/edit" */
  editUrl: string;
  gameEngine: GameDevGameEngineResponse;
  /** @example "123e4567-e89b-12d3-a456-426655440000" */
  gameId: string;
  /** @example "https://gmx.dev/game/YYDUNGEON?track=internaltrackid" */
  internalShareUrl: string;
  /** @example "https://gmx.dev/game/YYDUNGEON?track=publictrackid" */
  publicShareUrl: string;
  studio: GameDevStudioResponse;
  /** @example "Trekking 8" */
  title: string;
  /** @example "1.2.3.4" */
  version: string;
}

/** GameDevGamesResponse */
export interface GameDevGamesResponse {
  games: GameDevGameResponse[];
  pagination: PaginationResponse;
}

/** GameDevGraphicResponse */
export interface GameDevGraphicResponse {
  assetId: string;
  thumbnailUrl: string | null;
  /** Allowed values: `IMAGE`, ` VIDEO` */
  type: string;
  url: string | null;
}

/** GameDevStudioResponse */
export interface GameDevStudioResponse {
  /** @example "small@indie.com" */
  contactEmail: string;
  /**
   * @format date-time
   * @example "2023-07-13T05:22:33.536Z"
   */
  creationDate: string;
  /**
   * Notes: *Game maximum size in megabytes*
   * @format int64
   * @example 200
   */
  gameMaxSize: number;
  /** @example "Small indie company" */
  longDescription: string;
  members: GameDevUserResponse[];
  /** @example "Google Studia" */
  name: string;
  /** @example "27c388f9-2b67-4b71-8632-f3e80a6d257b" */
  studioId: string;
}

/** GameDevStudiosResponse */
export interface GameDevStudiosResponse {
  pagination: PaginationResponse;
  studios: GameDevStudioResponse[];
}

/** GameDevUpdateGameRequest */
export interface GameDevUpdateGameRequest {
  /** @example "ADULTS" */
  ageRating?: GameDevUpdateGameRequestAgeRatingEnum;
  /** @example "["DESKTOP", "MOBILE"]" */
  platforms?: GameDevUpdateGameRequestPlatformsEnum[] | null;
  /** @example "Some short description of the game" */
  shortDescription?: string | null;
  /** @example "A dog's life" */
  title?: string | null;
}

/** @example "ADULTS" */
export type GameDevUpdateGameRequestAgeRatingEnum =
  | "NOT_SET"
  | "EVERYONE"
  | "CHILDREN"
  | "EARLY_TEENS"
  | "TEENS"
  | "ADULTS"
  | "MATURE";

export type GameDevUpdateGameRequestPlatformsEnum = "DESKTOP" | "MOBILE";

/** GameDevUserResponse */
export interface GameDevUserResponse {
  /** @example "https://play.gmx.dev/users/123-ab-45-cde-6789?q1w23er45tyyui" */
  pictureUrl: string;
  /** @example "3f971b2f-9210-46c7-b688-03a5002bef9c" */
  userId: string;
  /** @example "genevieve_clam" */
  username: string;
}

export type GetGameDetailsCodeEnum = "game_access_denied" | "game_not_found";

export type GetProfileEnum = "DO_NOT_USE_NOT_SUPPORTED";

export type GetUserGamesCodeEnum =
  | "page_invalid"
  | "page_less_than_0"
  | "page_size_invalid"
  | "page_size_less_than_1"
  | "page_size_too_high"
  | "sign_in_required"
  | "studio_access_denied"
  | "game_engine_not_found"
  | "studio_not_found";

export type GetUserStudiosCodeEnum =
  | "page_invalid"
  | "page_less_than_0"
  | "page_size_invalid"
  | "page_size_less_than_1"
  | "page_size_too_high";

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
   * @format int64
   * @example 37
   */
  totalItems?: number;
  /**
   * @format int32
   * @example 4
   */
  totalPages?: number;
}

export type PublishGameCodeEnum =
  | "age_rating_not_set"
  | "game_access_denied"
  | "game_description_empty"
  | "game_is_blocked"
  | "missing_game_covers"
  | "no_graphics_uploaded"
  | "no_platforms_added"
  | "no_release_for_track"
  | "shared_array_buffer_is_not_supported"
  | "sign_up_not_completed"
  | "template_metadata_required_for_template"
  | "game_not_found"
  | "aws_upload_error";

/** SettingKey */
export interface SettingKey {
  defaultValue?: string;
  type?: SettingKeyTypeEnum;
}

export type SettingKeyTypeEnum = "STRING" | "INTEGER" | "BOOLEAN" | "GRAPHIC";

export type UpdateGameCodeEnum =
  | "game_access_denied"
  | "game_name_empty"
  | "game_name_taken"
  | "game_name_too_long"
  | "invalid_characters_in_name"
  | "invalid_request_payload"
  | "no_changes"
  | "short_description_too_long"
  | "game_not_found";

export type UploadCoverCodeEnum =
  | "game_access_denied"
  | "image_invalid_aspect_ratio"
  | "image_too_small"
  | "invalid_image"
  | "unsupported_graphic_format"
  | "video_not_allowed_as_image"
  | "game_not_found"
  | "internal_server_error";

/**
 * Aspect ratio for the cover to upload: can only be 16:9
 *
 * Also supports the name `aspect-ratio`
 */
export type UploadCoverParamsAspectRatioEnum = "16:9";

/**
 * Cover media type, defaults to `IMAGE`
 *
 * Also supports the name `cover-type`
 * @default "IMAGE"
 */
export type UploadCoverParamsCoverTypeEnum = "IMAGE" | "VIDEO";

export type UploadGameBundleCodeEnum =
  | "bundle_must_be_zip"
  | "game_access_denied"
  | "game_bundle_too_big"
  | "game_bundle_unsupported_charset"
  | "game_update_not_allowed"
  | "gms_runner_version_deprecated"
  | "gms_runner_version_required"
  | "missing_index_file"
  | "shared_array_buffer_is_not_supported"
  | "sign_in_required"
  | "upload_custom_game_bundle_not_allowed"
  | "version_number_too_low"
  | "game_not_found"
  | "gms_runner_version_not_found"
  | "aws_upload_error"
  | "internal_server_error";

export type UploadGraphicCodeEnum =
  | "game_access_denied"
  | "image_invalid_aspect_ratio"
  | "image_too_small"
  | "invalid_image"
  | "max_graphics_limit_reached"
  | "preview_required_for_videos"
  | "unsupported_graphic_format"
  | "video_not_allowed_as_image"
  | "game_not_found"
  | "internal_server_error";
