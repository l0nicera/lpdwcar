<?php

namespace App\Interfaces;


interface IConditionRepository {
    public function getAll(): array;
    public function findConditionsById(array $ids): array;
    public function getConditionsBySessionId(int $sessionId): array;
    public function saveConditions(int $sessionId, array $conditions): void;
    public function deleteConditions(int $sessionId): bool;
}
