<?php

namespace App\models;

use App\Infrastructure\Database;
use PDO;
use PDOException;

class SessionModel {
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getPDO();
    }

    public function saveSession($sessionData): void
    {
        try {
            $this->pdo->beginTransaction();

            if (empty($sessionData['id'])) {
                $stmt = $this->pdo->prepare("INSERT INTO sessions (start_datetime, stop_datetime, start_coords, stop_coords, roundtrip, travel_distance, nighttime, weather_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $sessionData['start_datetime'],
                    $sessionData['stop_datetime'],
                    $sessionData['start_coords'],
                    $sessionData['stop_coords'],
                    $sessionData['roundtrip'],
                    $sessionData['travel_distance'],
                    $sessionData['nighttime'],
                    $sessionData['weather_id']
                ]);
                $sessionData['id'] = $this->pdo->lastInsertId();
            } else {
                $stmt = $this->pdo->prepare("UPDATE sessions SET start_datetime = ?, stop_datetime = ?, start_coords = ?, stop_coords = ?, roundtrip = ?, travel_distance = ?, nighttime = ?, weather_id = ? WHERE id = ?");
                $stmt->execute([
                    $sessionData['start_datetime'],
                    $sessionData['stop_datetime'],
                    $sessionData['start_coords'],
                    $sessionData['stop_coords'],
                    $sessionData['roundtrip'],
                    $sessionData['travel_distance'],
                    $sessionData['nighttime'],
                    $sessionData['weather_id'],
                    $sessionData['id']
                ]);
            }
            $this->saveRelations($sessionData['id'], 'session_hazards', 'hazard_id', $sessionData['hazards']);
            $this->saveRelations($sessionData['id'], 'session_maneuvers', 'maneuver_id', $sessionData['maneuvers']);
            $this->saveRelations($sessionData['id'], 'session_parkings', 'parking_id', $sessionData['parkings']);
            $this->saveRelations($sessionData['id'], 'session_roadtypes', 'roadtype_id', $sessionData['roadtypes']);

            $this->pdo->commit();
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }


    private function saveRelations($sessionId, $tableName, $columnName, $values): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM $tableName WHERE session_id = ?");
        $stmt->execute([$sessionId]);

        $stmt = $this->pdo->prepare("INSERT INTO $tableName (session_id, $columnName) VALUES (?, ?)");
        foreach ($values as $value) {
            $stmt->execute([$sessionId, $value]);
        }
    }

    public function getAllSessions(): bool|array
    {
        $stmt = $this->pdo->query("SELECT * FROM sessions");
        $sessions = $stmt->fetchAll();

        foreach ($sessions as &$session) {
            $session['hazards'] = $this->getRelatedData($session['id'], 'session_hazards', 'hazard_id', 'hazards', 'name');
            $session['maneuvers'] = $this->getRelatedData($session['id'], 'session_maneuvers', 'maneuver_id', 'maneuvers', 'name');
            $session['parkings'] = $this->getRelatedData($session['id'], 'session_parkings', 'parking_id', 'parkings', 'name');
            $session['roadtypes'] = $this->getRelatedData($session['id'], 'session_roadtypes', 'roadtype_id', 'roadtypes', 'name');
        }

        return $sessions;
    }

    public function getSession($id) : bool|array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM sessions WHERE id = ?");
        $stmt->execute([$id]);
        $session = $stmt->fetch();

        if ($session) {
            $session['hazards'] = $this->getRelatedData($id, 'session_hazards', 'hazard_id', 'hazards');
            $session['maneuvers'] = $this->getRelatedData($id, 'session_maneuvers', 'maneuver_id', 'maneuvers');
            $session['parkings'] = $this->getRelatedData($id, 'session_parkings', 'parking_id', 'parkings');
            $session['roadtypes'] = $this->getRelatedData($id, 'session_roadtypes', 'roadtype_id', 'roadtypes');
        }

        return $session;
    }

    private function getRelatedData($sessionId, $tableName, $columnName, $referenceTable): bool|array
    {
        $stmt = $this->pdo->prepare("SELECT b.name FROM $tableName a JOIN $referenceTable b ON a.$columnName = b.id WHERE a.session_id = ?");
        $stmt->execute([$sessionId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function deleteSession($id): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM sessions WHERE id = ?");
        $stmt->execute([$id]);
    }

    public function deleteSessions(array $ids): void
    {
        $in = str_repeat('?,', count($ids) - 1) . '?';
        $stmt = $this->pdo->prepare("DELETE FROM sessions WHERE id IN ($in)");
        $stmt->execute($ids);
    }
}
