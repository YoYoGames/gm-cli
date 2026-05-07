# Editing GameMaker project files

Do not make changes to `.yy` or `.yyp` files yourself.
It's very hard to correctly edit these manually!
You MUST use commands exposed by the `gamemaker-resource-tool` MCP server.

# GameMaker Language (GML) Guidance

Make changes to `.gml` files using your built-in tools, if you so wish.

## GML Naming conventions

- Use `snake_case` for all variables and functions
- Prefix local variables with `_` (e.g., `var _temp_value`, `var _effect`)
- Prefix resource names based on their type, e.g. obj_player, spr_player, etc.

## GML reserved names

Your own names must avoid clashing with these:

- `score`, `lives`, `health`
- Position: `x`, `y`
- Sprite: `sprite_index`, `image_index`, `image_speed`, `image_xscale`, `image_yscale`, `image_angle`, `image_alpha`, `image_blend`
- Physics: `speed`, `direction`, `friction`, `gravity`, `gravity_direction`
- Collision: `bbox_left`, `bbox_right`, `bbox_top`, `bbox_bottom`
- Instance: `id`, `object_index`, `layer`, `depth`, `visible`, `persistent`

## Modern idiomatic GML

GML has support for **structs** (dynamic objects similar to JavaScript).

```gml
var _mystruct =
{
    a : 20,
    b : "Hello World"
};

// There is support for constructor functions and methods tied to the struct too
function Vector2(_x, _y) constructor
{
    x = _x;
    y = _y;

    static Add = function(_vec2)
    {
        x += _vec2.x;
        y += _vec2.y;
    }
}

v2 = new Vector2(10, 10);
```

GML _script_ files now requires one or more function definitions

```gml
// in move script
function move(spd, dir)
{
    speed = spd;
    direction = dir;
}

```

## Library Functions

- Prefer `instance_create_layer()` over deprecated `instance_create()`

# Running / debugging games

To help users debug and play games you can make use of:

```
npx @gamemaker/gm-cli compile --errors-only
npx @gamemaker/gm-cli run --errors-only
```
