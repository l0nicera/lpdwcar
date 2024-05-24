<?php

namespace App\Infrastructure\Repository;

require_once __DIR__ . '/../../Interfaces/IConditionRepository.php';
require_once __DIR__ . '/../../Entity/Hazard.php';

use App\Entity\Hazard;
use App\Interfaces\IConditionRepository;
use PDO;
class HazardRepository implements IConditionRepository {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function getAll(): array {
        $query = "SELECT id, name FROM hazards WHERE is_valid = 1";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute();
        $hazards = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $hazards[] = (new Hazard((int)$row['id'], $row['name']))->toArray();
        }
        return $hazards;
    }

    public function findConditionsById(array $ids): array {

        if (empty($ids)) {
            return [];
        }

        $inQuery = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->pdo->prepare("SELECT id, name FROM hazards WHERE id IN ($inQuery)");
        $stmt->execute($ids);
        $hazards = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $hazards[] = new Hazard((int)$row['id'], $row['name']);
        }
        return $hazards;
    }

    public function getConditionsBySessionId(int $sessionId): array {
        $stmt = $this->pdo->prepare("SELECT hazard_id FROM session_hazards WHERE session_id = ?");
        $stmt->execute([$sessionId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function saveConditions(int $sessionId, array $conditions): void {

        $CurrentIDs = [];
        foreach ($conditions as $hazard) {
            $CurrentIDs[] = $hazard->getId();
        }

        $existingConditionsIDs = $this->getConditionsBySessionId($sessionId);

        $conditionsToInsert = array_diff($CurrentIDs, $existingConditionsIDs);
        $conditionsToDelete = array_diff($existingConditionsIDs, $CurrentIDs);

        $stmtInsert = $this->pdo->prepare("INSERT INTO session_hazards (session_id, hazard_id) VALUES (?, ?)");
        foreach ($conditionsToInsert as $conditionId) {
            $stmtInsert->execute([$sessionId, $conditionId]);
        }

        if (!empty($conditionsToDelete)) {
            $inQuery = implode(',', array_fill(0, count($conditionsToDelete), '?'));
            $stmtDelete = $this->pdo->prepare("DELETE FROM session_hazards WHERE session_id = ? AND hazard_id IN ($inQuery)");
            $stmtDelete->execute(array_merge([$sessionId], $conditionsToDelete));
        }
    }

    public function deleteConditions(int $sessionId): bool {
        $stmt = $this->pdo->prepare("DELETE FROM session_hazards WHERE session_id = ?");
        return $stmt->execute([$sessionId]);
    }
}