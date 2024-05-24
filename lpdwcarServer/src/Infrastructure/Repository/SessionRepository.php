<?php

namespace App\Infrastructure\Repository;

require_once __DIR__ . '/../../Entity/Session.php';
require_once __DIR__ . '/../../Entity/Weather.php';
require_once __DIR__ . '/../../Entity/Hazard.php';
require_once __DIR__ . '/../../Entity/Maneuver.php';
require_once __DIR__ . '/../../Entity/Parking.php';
require_once __DIR__ . '/../../Entity/RoadType.php';
require_once __DIR__ . '/../../Entity/GPSPoint.php';
require_once __DIR__ . '/HazardRepository.php';
require_once __DIR__ . '/ManeuverRepository.php';
require_once __DIR__ . '/ParkingRepository.php';
require_once __DIR__ . '/RoadTypeRepository.php';
require_once __DIR__ . '/GPSPointRepository.php';

use App\Entity\Session;
use PDO;
use PDOException;

class SessionRepository {
    private PDO $pdo;
    private WeatherRepository $weatherRepository;
    private HazardRepository $hazardRepository;
    private ManeuverRepository $maneuverRepository;
    private ParkingRepository $parkingRepository;
    private RoadTypeRepository $roadTypeRepository;
    private GPSPointRepository $gpsPointRepository;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
        $this->weatherRepository = new WeatherRepository($pdo);
        $this->hazardRepository = new HazardRepository($pdo);
        $this->maneuverRepository = new ManeuverRepository($pdo);
        $this->parkingRepository = new ParkingRepository($pdo);
        $this->roadTypeRepository = new RoadTypeRepository($pdo);
        $this->gpsPointRepository = new GPSPointRepository($pdo);
    }

    public function save(Session $session): array
    {
        $this->pdo->beginTransaction();
        try {
            $this->saveSessionDetails($session);
            $this->hazardRepository->saveConditions($session->getId(), $session->getHazards());
            $this->maneuverRepository->saveConditions($session->getId(), $session->getManeuvers());
            $this->parkingRepository->saveConditions($session->getId(), $session->getParkings());
            $this->roadTypeRepository->saveConditions($session->getId(), $session->getRoadTypes());
            $this->gpsPointRepository->saveGPSPoints($session->getId(), $session->getGpsPoints());

            $this->pdo->commit();
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            throw $e;
        }
        return $session->toArray();
    }

    private function saveSessionDetails(Session $session): void {
        $data = $session->toArray();

        if (empty($data['id'])) {
            $stmt = $this->pdo->prepare("INSERT INTO sessions 
                (start_datetime, stop_datetime, start_coords, stop_coords, travel_distance, nighttime, weather_id) 
                VALUES (:start_datetime, :stop_datetime, :start_coords, :stop_coords, :travel_distance, :nighttime, :weather_id)");
            $stmt->execute([
                ':start_datetime' => $data['start_datetime'],
                ':stop_datetime' => $data['stop_datetime'],
                ':start_coords' => $data['start_coords'],
                ':stop_coords' => $data['stop_coords'],
                ':travel_distance' => $data['travel_distance'],
                ':nighttime' => $data['nighttime'],
                ':weather_id' => $session->getWeather()?->getId()
            ]);
            $session->setId($this->pdo->lastInsertId());
        } else {
            $stmt = $this->pdo->prepare("UPDATE sessions SET 
                start_datetime = :start_datetime, 
                stop_datetime = :stop_datetime, 
                start_coords = :start_coords, 
                stop_coords = :stop_coords, 
                travel_distance = :travel_distance, 
                nighttime = :nighttime, 
                weather_id = :weather_id 
                WHERE id = :id");
            $stmt->execute([
                ':start_datetime' => $data['start_datetime'],
                ':stop_datetime' => $data['stop_datetime'],
                ':start_coords' => $data['start_coords'],
                ':stop_coords' => $data['stop_coords'],
                ':travel_distance' => $data['travel_distance'],
                ':nighttime' => $data['nighttime'],
                ':weather_id' => $session->getWeather()?->getId(),
                ':id' => $data['id']
            ]);
        }
    }

    public function getAllSessions(): bool|array
    {
        $stmt = $this->pdo->query("SELECT id, start_datetime, stop_datetime, start_coords, stop_coords,
                                         travel_distance, nighttime, weather_id FROM sessions");
        $data = $stmt->fetchAll();
        $sessions = [];
        foreach ($data as $d) {
            $d['hazards'] = $this->hazardRepository->getConditionsBySessionId($d['id']);
            $d['maneuvers'] = $this->maneuverRepository->getConditionsBySessionId($d['id']);
            $d['parkings'] = $this->parkingRepository->getConditionsBySessionId($d['id']);
            $d['roadtypes'] = $this->roadTypeRepository->getConditionsBySessionId($d['id']);
            $d['gps_points'] = $this->gpsPointRepository->getGPSPointsBySessionId($d['id']);
            $session = New Session($d, $this->weatherRepository ,$this->hazardRepository, $this->maneuverRepository, $this->parkingRepository, $this->roadTypeRepository);
            $sessions[] = $session->toArray();
        }
        return $sessions;
    }

    public function getSession($id) : bool|array
    {
        $stmt = $this->pdo->prepare("SELECT id, start_datetime, stop_datetime, start_coords, stop_coords,
                                           travel_distance, nighttime, weather_id FROM sessions WHERE id = ?");
        $stmt->execute([$id]);
        $data = $stmt->fetch();
        if (isset($data['weather_id'])) {
            $weather = $this->weatherRepository->findWeatherById($data['weather_id']);
            $data['weather'] = $weather?->getId();
        } else {
            $data['weather'] = null;
        }
        $data['hazards'] = $this->hazardRepository->getConditionsBySessionId($id);
        $data['maneuvers'] = $this->maneuverRepository->getConditionsBySessionId($id);
        $data['parkings'] = $this->parkingRepository->getConditionsBySessionId($id);
        $data['roadtypes'] = $this->roadTypeRepository->getConditionsBySessionId($id);
        $data['gps_points'] = $this->gpsPointRepository->getGPSPointsBySessionId($id);

        $session = New Session($data, $this->weatherRepository ,$this->hazardRepository, $this->maneuverRepository, $this->parkingRepository, $this->roadTypeRepository);
        return $session->toArray();
    }

    public function deleteSession($id): bool
    {
        $this->pdo->beginTransaction();
        try {
            $this->deleteSessionDetails($id);
            $stmt = $this->pdo->prepare("DELETE FROM sessions WHERE id = ?");
            $stmt->execute([$id]);
            $this->pdo->commit();
            return true;
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function deleteSessions(array $ids): bool
    {
        if (empty($ids)) {
            return false;
        }

        $this->pdo->beginTransaction();
        $in = str_repeat('?,', count($ids) - 1) . '?';
        try {
            $stmt = $this->pdo->prepare("DELETE FROM sessions WHERE id IN ($in)");
            $stmt->execute($ids);
            foreach ($ids as $id) {
                $this->deleteSessionDetails($id);
            }
            $this->pdo->commit();
            return true;
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function getTotalTravelDistance(): float
    {
        $stmt = $this->pdo->query("SELECT SUM(travel_distance) AS total_distance FROM sessions");
        $result = $stmt->fetch();
        return (float) $result['total_distance'];
    }

    private function deleteSessionDetails(int $id): void
    {
        $conditions = [$this->hazardRepository, $this->maneuverRepository, $this->parkingRepository, $this->roadTypeRepository];
        foreach ($conditions as $condition) {
            $condition->deleteConditions($id);
        }
        $this->gpsPointRepository->deleteGPSPoints($id);
    }

}
