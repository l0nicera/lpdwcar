<?php

namespace App\Infrastructure\Repository;

require_once __DIR__ . '/../../Entity/Weather.php';

use App\Entity\Weather;
use PDO;

class WeatherRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function getAll(): array {
        $query = "SELECT id, name FROM weathers WHERE is_valid = 1";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute();
        $weathers = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $weathers[] = (new Weather((int)$row['id'], $row['name']))->toArray();
        }
        return $weathers;
    }

    public function findWeatherById(int $id): ?Weather {
        $stmt = $this->pdo->prepare("SELECT id, name FROM weathers WHERE id = ?");
        $stmt->execute([$id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($data) {
            return new Weather((int)$data['id'], $data['name']);
        }
        return null;
    }
}