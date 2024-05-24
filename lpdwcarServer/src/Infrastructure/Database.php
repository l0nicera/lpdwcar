<?php

namespace App\Infrastructure;
use PDO;
use PDOException;

class Database {
    private static ?PDO $pdo = null;

    public static function getPDO(): PDO {
        error_log("Enter in getPDO");
        if (self::$pdo === null) {
            $host = 'localhost';
            $db   = '';
            $user = '';
            $pass = '';
            $charset = 'utf8mb4';

            $dsn = "mysql:host=$host;dbname=$db;charset=$charset";

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            error_log("Attempting to connect to database: $dsn with user $user");

            try {
                error_log("Trying...");
                self::$pdo = new PDO($dsn, $user, $pass, $options);
                error_log("Database connection successful");
            } catch (PDOException $e) {
                error_log("Database connection failed: " . $e->getMessage());
                throw new PDOException($e->getMessage(), (int)$e->getCode());
            }
        }

        return self::$pdo;
    }
}