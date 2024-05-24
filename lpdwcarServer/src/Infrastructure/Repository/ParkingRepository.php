<?php

namespace App\Infrastructure\Repository;

require_once __DIR__ . '/../../Interfaces/IConditionRepository.php';
require_once __DIR__ . '/../../Entity/Parking.php';

use App\Entity\Parking;
use App\Interfaces\IConditionRepository;
use PDO;

class ParkingRepository implements IConditionRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function getAll(): array {
        $query = "SELECT id, name FROM parkings WHERE is_valid = 1";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute();
        $parkings = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $parkings[] = (new Parking((int)$row['id'], $row['name']))->toArray();
        }
        return $parkings;
    }

    public function findConditionsById(array $ids): array {

        if (empty($ids)) {
            return [];
        }

        $inQuery = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->pdo->prepare("SELECT id, name FROM parkings WHERE id IN ($inQuery)");
        $stmt->execute($ids);
        $parkings = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $parkings[] = new Parking((int)$row['id'], $row['name']);
        }
        return $parkings;
    }

    public function getConditionsBySessionId(int $sessionId): array {
        $stmt = $this->pdo->prepare("SELECT parking_id FROM session_parkings WHERE session_id = ?");
        $stmt->execute([$sessionId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function saveConditions(int $sessionId, array $conditions): void {

        $currentIDs = [];
        foreach ($conditions as $parking) {
            $currentIDs[] = $parking->getId();
        }

        $existingConditionsIDs = $this->getConditionsBySessionId($sessionId);

        $conditionsToInsert = array_diff($currentIDs, $existingConditionsIDs);
        $conditionsToDelete = array_diff($existingConditionsIDs, $currentIDs);

        $stmtInsert = $this->pdo->prepare("INSERT INTO session_parkings (session_id, parking_id) VALUES (?, ?)");
        foreach ($conditionsToInsert as $conditionId) {
            $stmtInsert->execute([$sessionId, $conditionId]);
        }

        if (!empty($conditionsToDelete)) {
            $inQuery = implode(',', array_fill(0, count($conditionsToDelete), '?'));
            $stmtDelete = $this->pdo->prepare("DELETE FROM session_parkings WHERE session_id = ? AND parking_id IN ($inQuery)");
            $stmtDelete->execute(array_merge([$sessionId], $conditionsToDelete));
        }
    }

    public function deleteConditions(int $sessionId): bool {
        $stmt = $this->pdo->prepare("DELETE FROM session_parkings WHERE session_id = ?");
        return $stmt->execute([$sessionId]);
    }
}