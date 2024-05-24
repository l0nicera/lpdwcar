<?php

namespace App\models;

require_once __DIR__ . '/../config/Database.php';

use App\Infrastructure\Database;
use PDO;

abstract class BaseConditionModel implements \JsonSerializable {
    protected int $id;
    protected string $name;

    public function __construct($data = null) {
        if ($data) {
            $this->id = $data['id'] ?? 0;
            $this->name = $data['name'];
        }
    }

    abstract protected static function getTableName(): string;

    public static function getById(int $id): ?self {
        if (!$id) return null;
        $pdo = Database::getPDO();
        $stmt = $pdo->prepare("SELECT id, name FROM " . static::getTableName() . " WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($data) {
            return new static($data);
        }

        return null;
    }

    public static function getAllValid(): array {
        $pdo = Database::getPDO();
        $query = "SELECT id, name FROM " . static::getTableName() . " WHERE is_valid = 1";
        $stmt = $pdo->query($query);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conditions = [];
        foreach ($results as $row) {
            $conditions[] = new static($row);
        }

        return $conditions;
    }

    public function getId(): int {
        return $this->id;
    }

    public function getName(): string {
        return $this->name;
    }

    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name
        ];
    }

}
