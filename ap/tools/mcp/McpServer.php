<?php

declare(strict_types=1);

require_once __DIR__ . '/GerogoTools.php';

/**
 * The JSON-RPC 2.0 / stdio transport half of this MCP server — read one
 * line at a time from STDIN (each line is exactly one JSON-RPC message,
 * per the MCP stdio transport spec: messages are newline-delimited and
 * must never contain an embedded newline themselves), dispatch it, and
 * write exactly one line back to STDOUT per request — never for a
 * notification (no "id" at all), which gets no response. GerogoTools is
 * where every actual tool lives; this class only knows the protocol,
 * not what any tool does.
 */
final class McpServer
{
    private GerogoTools $tools;

    public function __construct(string $basePath)
    {
        $this->tools = new GerogoTools($basePath);

        // Nothing on STDOUT but protocol messages, ever — a stray PHP
        // warning printed there would look like a malformed JSON-RPC
        // line to the client and corrupt the whole stream.
        ini_set('display_errors', '0');
    }

    public function run(): void
    {
        while (($line = fgets(STDIN)) !== false) {
            $line = trim($line);

            if ($line !== '') {
                $this->handle($line);
            }
        }
    }

    private function handle(string $line): void
    {
        try {
            $message = json_decode($line, true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            $this->sendError(null, -32700, 'Parse error: ' . $e->getMessage());

            return;
        }

        $id = $message['id'] ?? null;
        $method = $message['method'] ?? null;
        $params = is_array($message['params'] ?? null) ? $message['params'] : [];

        if ($method === null) {
            return;
        }

        // A notification (no "id" at all in the incoming message) never
        // gets a response — regardless of which notification it is, so
        // this doesn't need to enumerate every one the client might send.
        if ($id === null && str_starts_with($method, 'notifications/')) {
            return;
        }

        try {
            $result = match ($method) {
                'initialize' => $this->initialize($params),
                'ping' => new \stdClass(),
                'tools/list' => ['tools' => $this->tools->definitions()],
                'tools/call' => $this->callTool($params),
                default => throw new \RuntimeException("Unknown method: $method"),
            };
        } catch (\Throwable $e) {
            if ($id !== null) {
                $this->sendError($id, -32601, $e->getMessage());
            }

            return;
        }

        if ($id !== null) {
            $this->sendResult($id, $result);
        }
    }

    /** @param array<string, mixed> $params */
    private function initialize(array $params): array
    {
        return [
            // Echo back whatever the client asked for — this server has
            // no version-specific behavior (just tools/list + tools/call,
            // stable across MCP protocol revisions), so there's nothing
            // to actually negotiate beyond "yes, that works".
            'protocolVersion' => $params['protocolVersion'] ?? '2024-11-05',
            'capabilities' => ['tools' => new \stdClass()],
            'serverInfo' => ['name' => 'gerogo-dev', 'version' => '1.0.0'],
        ];
    }

    /** @param array<string, mixed> $params */
    private function callTool(array $params): array
    {
        $name = $params['name'] ?? throw new \InvalidArgumentException('tools/call missing "name"');
        $arguments = is_array($params['arguments'] ?? null) ? $params['arguments'] : [];

        $result = $this->tools->call($name, $arguments);

        return [
            'content' => [['type' => 'text', 'text' => $result['text']]],
            'isError' => $result['isError'],
        ];
    }

    private function sendResult(int|string $id, mixed $result): void
    {
        $this->write(['jsonrpc' => '2.0', 'id' => $id, 'result' => $result ?? new \stdClass()]);
    }

    private function sendError(int|string|null $id, int $code, string $message): void
    {
        $this->write(['jsonrpc' => '2.0', 'id' => $id, 'error' => ['code' => $code, 'message' => $message]]);
    }

    /** @param array<string, mixed> $payload */
    private function write(array $payload): void
    {
        fwrite(STDOUT, json_encode($payload, JSON_UNESCAPED_SLASHES) . "\n");
        fflush(STDOUT);
    }
}
