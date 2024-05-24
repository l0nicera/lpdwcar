<?php

namespace App\Infrastructure\Repository;

require_once __DIR__ . '/../../Entity/GPSPoint.php';

use App\Entity\GPSPoint;
use PDO;

class GPSPointRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function getGPSPointsBySessionId(int $sessionId): array {
        $stmt = $this->pdo->prepare("SELECT id, latitude, longitude, recorded_at FROM session_gps_points WHERE session_id = ?");
        $stmt->execute([$sessionId]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $gpsPoints = [];
        foreach ($results as $row) {
            $gpsPoints[] = new GPSPoint($row['latitude'], $row['longitude'], $row['recorded_at']);
        }
        return $gpsPoints;
    }

    public function saveGPSPoints(int $sessionId, array $conditions): void {
        $stmt = $this->pdo->prepare("INSERT INTO session_gps_points (session_id, latitude, longitude, recorded_at) VALUES (?, ?, ?, ?)");
        foreach ($conditions as $gpsPoint) {
            if (!$gpsPoint instanceof GPSPoint) {
                throw new \InvalidArgumentException("All items must be instances of GPSPoint");
            }
            $stmt->execute([
                $sessionId,
                $gpsPoint->getLatitude(),
                $gpsPoint->getLongitude(),
                $gpsPoint->getRecordedAt()->format('Y-m-d H:i:s')
            ]);
        }
    }

    public function deleteGPSPoints(int $sessionId): bool {
        $stmt = $this->pdo->prepare("DELETE FROM session_gps_points WHERE session_id = ?");
        return $stmt->execute([$sessionId]);
    }
}