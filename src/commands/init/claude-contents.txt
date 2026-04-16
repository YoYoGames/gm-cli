# Important: how to edit projects

It's very hard to correctly edit project files manually! Instead of making changes to
`.yy` files yourself you MUST make use of commands exposed by the `gamemaker-mcp` server. However, if you want to make changes to existing `.gml` files you may use your built-in tools if you so wish.

# Running / debugging games

To help users debug and play games you can make use of:

```
npx @gamemaker/gm-cli compile --errors-only
npx @gamemaker/gm-cli run --errors-only
```

## GameMaker Language (GML) Naming Conventions

**Naming conventions**

- Use `snake_case` for all variables and functions
- Prefix local variables with `_` (e.g., `var _temp_value`, `var _effect`)
- Prefix resource names based on their type, e.g. obj_player, spr_player, etc.

**Built-in reserved variables:**

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

GML *script* files now requires one or more function definitions

```gml
// in move script
function move(spd, dir)
{
    speed = spd;
    direction = dir;
}

```

Also,

- Prefer `instance_create_layer()` over deprecated `instance_create()`
