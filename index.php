<?php
declare(strict_types=1);

session_start();

if (!isset($_SESSION['cargo_zero'])) {
    $_SESSION['cargo_zero'] = [
        'runs' => 0,
        'successful_runs' => 0,
        'best_score' => 0,
        'best_balance' => null,
        'best_delivered' => 0,
    ];
}

$stats = $_SESSION['cargo_zero'];
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Cargo Zero — JS + PHP</title>
    <meta
        name="description"
        content="Balance cargo, survive turbulence and deliver the load."
    >
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
<main class="shell">
    <header class="hero">
        <div>
            <span class="eyebrow">ORBITAL CARGO BALANCING</span>
            <h1>Load it. Balance it. Survive it.</h1>
            <p>
                Place cargo inside the hold, keep the center of mass near the ship core,
                then launch and survive a turbulent orbital transfer.
            </p>
        </div>

        <button id="restart" class="text-button" type="button">New manifest</button>
    </header>

    <section class="stats">
        <div><span>Score</span><strong id="score">0</strong></div>
        <div><span>Best</span><strong id="best"><?= (int)$stats['best_score'] ?></strong></div>
        <div><span>Balance</span><strong id="balance">—</strong></div>
        <div><span>Hull</span><strong id="hull">100%</strong></div>
    </section>

    <section class="layout">
        <section class="game-card">
            <div class="game-head">
                <div>
                    <span class="eyebrow">CARGO HOLD</span>
                    <h2 id="mission-title">Build a stable loadout.</h2>
                </div>

                <span id="phase-pill" class="phase-pill">LOADING</span>
            </div>

            <canvas
                id="game"
                width="900"
                height="650"
                aria-label="Cargo Zero game"
            ></canvas>

            <section class="bottom-bar">
                <div>
                    <span class="eyebrow">CENTER OF MASS</span>
                    <strong id="com-readout">0.0 / 0.0</strong>
                </div>

                <div>
                    <span class="eyebrow">MASS</span>
                    <strong id="mass-readout">0 kg</strong>
                </div>

                <button id="launch" type="button">Launch cargo run</button>
            </section>
        </section>

        <aside class="side">
            <section class="panel">
                <span class="eyebrow">MANIFEST</span>
                <div id="manifest" class="manifest"></div>
            </section>

            <section class="panel">
                <span class="eyebrow">SHIP STATUS</span>
                <dl>
                    <div><dt>Phase</dt><dd id="phase-value">Loading</dd></div>
                    <div><dt>Delivered</dt><dd id="delivered">0 / 0</dd></div>
                    <div><dt>Damaged</dt><dd id="damaged">0</dd></div>
                    <div><dt>Turbulence</dt><dd id="turbulence">—</dd></div>
                </dl>
            </section>

            <section class="panel">
                <span class="eyebrow">CARGO TYPES</span>
                <div class="legend">
                    <div><i class="cargo-normal"></i><span>Standard</span></div>
                    <div><i class="cargo-fragile"></i><span>Fragile</span></div>
                    <div><i class="cargo-hazard"></i><span>Hazardous</span></div>
                    <div><i class="cargo-dense"></i><span>Dense</span></div>
                </div>
            </section>

            <section class="panel">
                <span class="eyebrow">RECORDS</span>
                <dl>
                    <div><dt>Runs</dt><dd><?= (int)$stats['runs'] ?></dd></div>
                    <div><dt>Successful</dt><dd><?= (int)$stats['successful_runs'] ?></dd></div>
                    <div><dt>Best delivered</dt><dd><?= (int)$stats['best_delivered'] ?></dd></div>
                    <div>
                        <dt>Best balance</dt>
                        <dd><?= $stats['best_balance'] === null ? '—' : e(number_format((float)$stats['best_balance'], 1) . '%') ?></dd>
                    </div>
                </dl>
            </section>

            <section class="panel">
                <span class="eyebrow">HOW IT WORKS</span>
                <p>
                    Click a cargo crate, then click an empty hold slot. Heavy crates pull
                    the center of mass harder. Fragile cargo dislikes turbulence; hazardous
                    cargo causes extra hull damage if it shifts.
                </p>
            </section>
        </aside>
    </section>

    <footer>
        <span>Canvas simulation · center of mass · turbulence · PHP sessions</span>
        <span>cargo-zero</span>
    </footer>
</main>

<script>
window.CARGO_ZERO_STATS = <?= json_encode([
    'bestScore' => (int)$stats['best_score'],
    'bestDelivered' => (int)$stats['best_delivered'],
    'bestBalance' => $stats['best_balance'],
    'runs' => (int)$stats['runs'],
]) ?>;
</script>
<script src="assets/app.js"></script>
</body>
</html>
<?php
function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
