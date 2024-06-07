<?php

namespace App\Controllers;

require_once __DIR__ . '/../Infrastructure/Repository/WeatherRepository.php';
require_once __DIR__ . '/../Infrastructure/Repository/HazardRepository.php';
require_once __DIR__ . '/../Infrastructure/Repository/ManeuverRepository.php';
require_once __DIR__ . '/../Infrastructure/Repository/ParkingRepository.php';
require_once __DIR__ . '/../Infrastructure/Repository/RoadTypeRepository.php';

use App\Core\Response;
use App\Infrastructure\Repository\HazardRepository;
use App\Infrastructure\Repository\ManeuverRepository;
use App\Infrastructure\Repository\ParkingRepository;
use App\Infrastructure\Repository\RoadTypeRepository;
use App\Infrastructure\Repository\WeatherRepository;
use Exception;
use PDOException;

class ConditionController {
    private WeatherRepository $weatherRepository;
    private HazardRepository $hazardRepository;
    private ManeuverRepository $maneuverRepository;
    private ParkingRepository $parkingRepository;
    private RoadTypeRepository $roadTypeRepository;


    public function __construct(
        WeatherRepository $weatherRepository,
        HazardRepository $hazardRepository,
        ManeuverRepository $maneuverRepository,
        ParkingRepository $parkingRepository,
        RoadTypeRepository $roadTypeRepository
    ) {
        $this->weatherRepository = $weatherRepository;
        $this->hazardRepository = $hazardRepository;
        $this->maneuverRepository = $maneuverRepository;
        $this->parkingRepository = $parkingRepository;
        $this->roadTypeRepository = $roadTypeRepository;
    }
    public function getAllConditions(): Response {
        header('Content-Type: application/json');
        try {
            $conditions = [
                'weathers' => $this->weatherRepository->getAll(),
                'hazards' => $this->hazardRepository->getAll(),
                'maneuvers' => $this->maneuverRepository->getAll(),
                'parkings' => $this->parkingRepository->getAll(),
                'roadtypes' => $this->roadTypeRepository->getAll()
            ];
            // $this->sendJsonResponse(200, ['status' => 'success', 'text' => 'All conditions fetched successfully.'], $conditions);
            $outputData = [
                'status' => 'success',
                'text' => 'All conditions fetched successfully.',
                'data' => $conditions
            ];
            // Là je retourne ma reponse
            return Response::json(200, $outputData);
        } catch (PDOException $e) {
            error_log("PDOException on getAllConditions: " . $e->getMessage());
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Database error occurred while fetching all conditions.']);
        } catch (Exception $e) {
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Failed to retrieve all conditions: ' . $e->getMessage()]);
        }
    }

    private function sendJsonResponse($status, $message, $data = null): void
    {
        header('Content-Type: application/json');
        http_response_code($status);
        $response = ['status' => $message['status'], 'message' => $message['text']];
        if ($data !== null) {
            $response['data'] = $data;
        }
        echo json_encode($response);
    }
}
