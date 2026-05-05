/* eslint-disable */
export const ApiErrorCodes = {
  age_rating_not_set: "age rating needed to publish the public track",
  asset_not_found: "asset not found",
  aws_upload_error: "failed uploading the file to S3",
  breaking_published_game:
    "game is published and this operation would break requirements for publication",
  bundle_must_be_zip: "only zip files are allowed for game bundles",
  cover_not_found: "cover not found",
  game_access_denied: "game access denied",
  game_bundle_too_big: "game bundle exceeds the maximum size",
  game_bundle_unsupported_charset:
    "game bundle was encoded with an unsupported charset",
  game_cover_not_found: "cover id not valid or not found for provided gameId",
  game_creation_not_allowed:
    "only the owner of the group may create a game for the group",
  game_description_empty:
    "short description needed to publish the public track",
  game_engine_not_found: "game engine not found",
  game_is_blocked: "game is currently blocked",
  game_name_empty: "a game name is required",
  game_name_taken: "name already in use by another game",
  game_name_too_long: "game name too long",
  game_not_found: "game id not valid or game not visible to user",
  game_update_not_allowed: "user doesn't have the rights for updating game",
  gms_runner_version_deprecated: "selected GMS runner version is deprecated",
  gms_runner_version_not_found: "GMS runner not found",
  gms_runner_version_required: "GMS runner version is required",
  image_invalid_aspect_ratio: "the image has an invalid aspect ratio",
  image_too_small: "the image is too small",
  internal_server_error: "internal server error",
  invalid_characters_in_name: "name contains one or more invalid characters",
  invalid_image: "image validation failed",
  invalid_request_payload: "validation error in payload request",
  invalid_studio_ownership:
    "the users studio has an invalid amount of owners (not 1)",
  max_games_limit_reached: "the group has reached its max games limit",
  max_graphics_limit_reached:
    "the game has reached the maximum number of graphics per game limit",
  missing_game_covers:
    "must have a cover uploaded for all supported aspect ratios",
  missing_index_file: "uploaded bundle is missing the file index.html",
  no_changes: "the request resulted in no changes",
  no_graphics_uploaded: "at least 1 graphic needed to publish the public track",
  no_platforms_added:
    "at least one platform needed to publish the public track",
  no_release_for_track: "no releases on the selected track",
  no_specific_studio_for_user: "The user doesn't have a specific studio",
  page_invalid: "invalid page parameter value; must be a valid decimal integer",
  page_less_than_0: "invalid page parameter value; must be 0 or higher",
  page_size_invalid:
    "invalid pageSize parameter value; must be a valid decimal integer",
  page_size_less_than_1:
    "invalid pageSize parameter value; must be 1 or higher",
  page_size_too_high: "the page size exceeds the maximum limit",
  preview_required_for_videos:
    "when uploading videos, a 'preview' image must be included as a thumbnail",
  shared_array_buffer_is_not_supported:
    "Shared Array buffer support is not provided",
  short_description_too_long: "short description too long",
  sign_in_required: "the user must be signed in",
  sign_up_not_completed: "user has not completed the sign-up process",
  studio_access_denied: "studio access denied",
  studio_not_found: "studio id not valid",
  template_metadata_required_for_template:
    "games in the HH Store should have template metadata",
  unsupported_graphic_format:
    "the image format is not supported or could not be identified",
  upload_custom_game_bundle_not_allowed:
    "upload custom game bundle not allowed",
  version_number_too_low: "version number is lower than previous version",
  video_not_allowed_as_image: "not allowed to use video as image",
};
