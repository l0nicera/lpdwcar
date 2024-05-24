<?php

namespace App\Infrastructure\Repository;

require_once __DIR__ . '/../../Interfaces/IConditionRepository.php';
require_once __DIR__ . '/../../Entity/Maneuver.php';

use App\Entity\Maneuver;
use App\Interfaces\IConditionRepository;
use PDO;

class ManeuverRepository implements IConditionRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function getAll(): array {
        $query = "SELECT id, name FROM maneuvers WHERE is_valid = 1";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute();
        $maneuvers = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $maneuvers[] = (new Maneuver((int)$row['id'], $row['name']))->toArray();
        }
        return $maneuvers;
    }

    public function findConditionsById(array $ids): array {

        if (empty($ids)) {
            return [];
        }

        $inQuery = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->pdo->prepare("SELECT id, name FROM maneuvers WHERE id IN ($inQuery)");
        $stmt->execute($ids);
        $maneuvers = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $maneuvers[] = new Maneuver((int)$row['id'], $row['name']);
        }
        return $maneuvers;
    }

    public function getConditionsBySessionId(int $sessionId): array {
        $stmt = $this->pdo->prepare("SELECT maneuver_id FROM session_maneuvers WHERE session_id = ?");
        $stmt->execute([$sessionId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function saveConditions(int $sessionId, array $conditions): void {

        $currentIDs = [];
        foreach ($conditions as $maneuver) {
            $currentIDs[] = $maneuver->getId();
        }

        $existingConditionsIDs = $this->getConditionsBySessionId($sessionId);

        $conditionsToInsert = array_diff($currentIDs, $existingConditionsIDs);
        $conditionsToDelete = array_diff($existingConditionsIDs, $currentIDs);

        $stmtInsert = $this->pdo->prepare("INSERT INTO session_maneuvers (session_id, maneuver_id) VALUES (?, ?)");
        foreach ($conditionsToInsert as $conditionId) {
            $stmtInsert->execute([$sessionId, $conditionId]);
        }

        if (!empty($conditionsToDelete)) {
            $inQuery = implode(',', array_fill(0, count($conditionsToDelete), '?'));
            $stmtDelete = $this->pdo->prepare("DELETE FROM session_maneuvers WHERE session_id = ? AND maneuver_id IN ($inQuery)");
            $stmtDelete->execute(array_merge([$sessionId], $conditionsToDelete));
        }
    }

    public function deleteConditions(int $sessionId): bool {
        $stmt = $this->pdo->prepare("DELETE FROM session_maneuvers WHERE session_id = ?");
        return $stmt->execute([$sessionId]);
    }
}