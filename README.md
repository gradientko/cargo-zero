# cargo-zero

A cargo-balancing orbital delivery game built with vanilla JavaScript and PHP sessions.

The player receives a randomized manifest of cargo crates, places them inside a ship hold, watches the center of mass shift in real time, and then launches into a turbulent orbital transfer.

A bad loadout can cause cargo to shift, fragile crates to break, hazardous cargo to damage the hull, and the mission to fail.

## Features

- interactive cargo hold
- randomized cargo manifest
- 6 × 4 placement grid
- real center-of-mass calculation
- live balance score
- multiple cargo classes
- crate integrity
- cargo shifting during turbulence
- increasing orbital turbulence
- hazardous cargo penalties
- hull integrity
- delivered / damaged counters
- score system
- PHP session records
- responsive Canvas UI
- mouse and touch controls
- no framework
- no database

## Cargo types

### Standard

Balanced general-purpose freight.

### Fragile

Lower mass, but much more likely to take damage when the ship becomes unstable.

### Hazardous

If its integrity drops far enough, the ship takes additional hull damage.

### Dense

Very heavy cargo.

A dense crate has a much larger effect on the ship's center of mass.

## Center of mass

For every loaded crate:

```text
weighted X = crate X × crate mass
weighted Y = crate Y × crate mass
```

The game sums all weighted positions and divides them by total cargo mass.

That produces the current center of mass.

The closer it is to the center of the hold, the higher the balance score.

## Loading phase

Click a crate in the manifest.

Then click an empty cargo slot.

The HUD updates:

```text
CENTER OF MASS
TOTAL MASS
BALANCE
```

You can click an already placed crate to select it again and move it to another empty slot.

All cargo must be loaded before launch.

An extremely unstable loadout cannot launch.

## Flight phase

The orbital transfer lasts roughly 22 seconds.

As the flight progresses:

- turbulence increases
- poorly balanced cargo is more likely to shift
- fragile cargo loses integrity faster
- hazardous cargo can damage the hull
- extreme imbalance directly damages the ship

The goal is to deliver at least 70% of the cargo with the hull still intact.

## PHP

PHP sessions store:

```text
runs
successful runs
best score
best balance
best delivered count
```

The real-time simulation runs in JavaScript.

## Run

Requirements:

```text
PHP 8.1+
modern browser
```

Start the local server:

```bash
php -S localhost:8000
```

Open:

```text
http://localhost:8000
```

## Project structure

```text
cargo-zero/
├── index.php
├── score.php
├── assets/
│   ├── app.js
│   └── style.css
├── README.md
└── LICENSE
```

## GitHub Pages

GitHub Pages cannot execute PHP.

Use PHP-capable hosting, a VPS, Docker/PHP-Apache, or PHP's built-in development server.

## License

MIT
