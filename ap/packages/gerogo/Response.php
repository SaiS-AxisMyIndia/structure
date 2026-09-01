<?php

declare(strict_types=1);

namespace Gerogo;

/**
 * Writes an HTTP response and halts execution — the framework's terminal
 * output point, equivalent to returning a ResponseEntity<?> from a Spring
 * @RestController method.
 */
class Response
{
    /**
     * json() takes a Packet, never a raw payload — every JSON response,
     * success or failure, goes out in the same { success, message, data }
     * shape (plus whatever a Packet::with() call attached, e.g. Session's
     * 'token').
     */
    public static function json(Packet $packet, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($packet->toArray(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        exit;
    }

    /** For the rare controller that serves a page instead of JSON — e.g. Tester's own UI. */
    public static function html(string $html, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: text/html; charset=utf-8');
        echo $html;
        exit;
    }
}
