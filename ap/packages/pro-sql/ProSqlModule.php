<?php

declare(strict_types=1);

namespace ProSql;

use ApiPro\Container;
use ApiPro\Module;
use ApiPro\Runner;

/**
 * Wires ProSql into the Kernel: binds a single shared Connection, built
 * from Runner::get('prosql') — runner/prosql.php's DB_* config — the same
 * way Spring Boot auto-configures a DataSource bean from
 * spring.datasource.* properties. Contributes no controllers.
 * Self-configuring, no constructor args — so it can be booted purely from
 * app.php's `'@pro-sql' => '1.0.0'` entry.
 */
class ProSqlModule extends Module
{
    public function register(Container $container): void
    {
        $config = Runner::get('prosql');

        $container->singleton(Connection::class, static fn (): Connection => new Connection($config));
    }

    public function controllers(): array
    {
        return [];
    }
}
