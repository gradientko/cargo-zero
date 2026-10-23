<?php
declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    respond(['error' => 'Invalid JSON'], 400);
}

$score = $input['score'] ?? null;
$delivered = $input['delivered'] ?? null;
$total = $input['total'] ?? null;
$balance = $input['balance'] ?? null;
$successful = $input['successful'] ?? null;

if (
    !is_int($score) ||
    !is_int($delivered) ||
    !is_int($total) ||
    !is_numeric($balance) ||
    !is_bool($successful)
) {
    respond(['error' => 'Invalid result'], 422);
}

$balance = (float)$balance;

if (
    $score < 0 || $score > 100000000 ||
    $delivered < 0 || $delivered > 1000 ||
    $total < 0 || $total > 1000 ||
    $delivered > $total ||
    $balance < 0 || $balance > 100
) {
    respond(['error' => 'Result out of range'], 422);
}

if (!isset($_SESSION['cargo_zero'])) {
    $_SESSION['cargo_zero'] = [
        'runs' => 0,
        'successful_runs' => 0,
        'best_score' => 0,
        'best_balance' => null,
        'best_delivered' => 0,
    ];
}

$stats =& $_SESSION['cargo_zero'];
$stats['runs']++;

if ($successful) {
    $stats['successful_runs']++;
}

$stats['best_score'] = max($stats['best_score'], $score);
$stats['best_delivered'] = max($stats['best_delivered'], $delivered);

if (
    $stats['best_balance'] === null ||
    $balance > $stats['best_balance']
) {
    $stats['best_balance'] = $balance;
}

respond([
    'ok' => true,
    'stats' => $stats,
]);
