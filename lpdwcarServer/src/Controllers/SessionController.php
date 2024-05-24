<?php

namespace App\Controllers;

require_once __DIR__ . '/../Entity/Session.php';
require_once __DIR__ . '/../Infrastructure/Repository/SessionRepository.php';
require_once __DIR__ . '/../Infrastructure/Repository/WeatherRepository.php';
require_once __DIR__ . '/../Infrastructure/Repository/HazardRepository.php';
require_once __DIR__ . '/../Infrastructure/Repository/ManeuverRepository.php';
require_once __DIR__ . '/../Infrastructure/Repository/ParkingRepository.php';
require_once __DIR__ . '/../Infrastructure/Repository/RoadTypeRepository.php';
require_once __DIR__ . '/../Services/SessionValidator.php';

use App\Infrastructure\Repository\HazardRepository;
use App\Infrastructure\Repository\ManeuverRepository;
use App\Infrastructure\Repository\ParkingRepository;
use App\Infrastructure\Repository\RoadTypeRepository;
use App\Infrastructure\Repository\SessionRepository;
use App\Entity\Session;
use App\Infrastructure\Repository\WeatherRepository;
use App\Services\SessionValidator;
use Exception;
use PDOException;

class SessionController {
    private SessionRepository $sessionRepository;
    private WeatherRepository $weatherRepository;
    private HazardRepository $hazardRepository;
    private ManeuverRepository $maneuverRepository;
    private ParkingRepository $parkingRepository;
    private RoadTypeRepository $roadTypeRepository;
    private SessionValidator $validator;


    public function __construct(
        SessionRepository $sessionRepository,
        WeatherRepository $weatherRepository,
        HazardRepository $hazardRepository,
        ManeuverRepository $maneuverRepository,
        ParkingRepository $parkingRepository,
        RoadTypeRepository $roadTypeRepository,
        SessionValidator $validator
    ) {
        $this->sessionRepository = $sessionRepository;
        $this->weatherRepository = $weatherRepository;
        $this->hazardRepository = $hazardRepository;
        $this->maneuverRepository = $maneuverRepository;
        $this->parkingRepository = $parkingRepository;
        $this->roadTypeRepository = $roadTypeRepository;
        $this->validator = $validator;
    }

    public function saveSession(): void {
        header('Content-Type: application/json');
        $sessionData = (array) json_decode(file_get_contents('php://input'), true);

        if (empty($sessionData)) {
            $this->sendJsonResponse(400, ['status' => 'error', 'text' => 'No data provided for the session.']);
            return;
        }

        $validationErrors = $this->validator->validate($sessionData);
        if (!empty($validationErrors)) {
            $this->sendJsonResponse(400, ['status' => 'error', 'text' => 'Validation errors occurred.', 'errors' => $validationErrors]);
            return;
        }

        try {
            $session = new Session(
                $sessionData,
                $this->weatherRepository,
                $this->hazardRepository,
                $this->maneuverRepository,
                $this->parkingRepository,
                $this->roadTypeRepository
            );

            $savedSession = $this->sessionRepository->save($session);
            $this->sendJsonResponse(200, ['status' => 'success', 'text' => 'Session saved successfully.'], $savedSession);
        } catch (PDOException $e) {
            error_log("PDOException on saveSession: " . $e->getMessage());
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Database error occurred while saving session.']);
        } catch (Exception $e) {
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Failed to save session: ' . $e->getMessage()]);
        }
    }


    public function getSessions(): void {
        header('Content-Type: application/json');
        try {
            $sessions = $this->sessionRepository->getAllSessions();
            if (is_array($sessions)) {
                if (count($sessions) > 0) {
                    $this->sendJsonResponse(200, ['status' => 'success', 'text' => 'Sessions fetched successfully'], $sessions);
                } else {
                    $this->sendJsonResponse(200, ['status' => 'success', 'text' => 'No sessions found.'], $sessions);
                }
            } else {
                $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Unexpected error occurred while fetching sessions.']);
            }
        } catch (PDOException $e) {
            error_log("PDOException on getSessions: " . $e->getMessage());
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Database error occurred while fetching sessions.']);
        } catch (Exception $e) {
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Failed to retrieve sessions: ' . $e->getMessage()]);
        }
    }

    public function getSession($id): void {
        header('Content-Type: application/json');

        if (!is_numeric($id) || $id <= 0) {
            $this->sendJsonResponse(400, ['status' => 'error', 'text' => 'Invalid session ID.']);
            return;
        }

        try {
            $session = $this->sessionRepository->getSession($id);
            if ($session) {
                $this->sendJsonResponse(200, ['status' => 'success', 'text' => 'Session fetched successfully: ID ' . $id], $session);
            } else {
                $this->sendJsonResponse(404, ['status' => 'error', 'text' => 'Session not found: ID ' . $id]);
            }
        } catch (PDOException $e) {
            error_log("PDOException on getSession: " . $e->getMessage());
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Database error occurred while retrieving the session.']);
        } catch (Exception $e) {
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Failed to retrieve session: ' . $e->getMessage()]);
        }
    }

    public function deleteSession($id): void
    {
        if (!is_numeric($id) || $id <= 0) {
            $this->sendJsonResponse(400, ['status' => 'error', 'text' => 'Invalid session ID.']);
            return;
        }

        try {
            $this->sessionRepository->deleteSession($id);
            $this->sendJsonResponse(200, ['status' => 'success', 'text' => 'Session deleted successfully: ID ' . $id]);
        } catch (PDOException $e) {
            error_log("PDOException on deleteSession: " . $e->getMessage());
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Database error occurred while deleting session.']);
        } catch (Exception $e) {
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Failed to delete session: ' . $e->getMessage()]);
        }
    }

    public function deleteSessions($ids): void
    {
        if (!is_array($ids) || empty($ids) || !array_reduce($ids, function ($is_valid, $id) { return $is_valid && is_numeric($id) && $id > 0; }, true)) {
            $this->sendJsonResponse(400, ['status' => 'error', 'text' => 'Invalid session IDs.']);
            return;
        }

        try {
            $this->sessionRepository->deleteSessions($ids);
            $this->sendJsonResponse(200, ['status' => 'success', 'text' => 'Sessions deleted successfully: IDs ' . implode(', ', $ids)]);
        } catch (PDOException $e) {
            error_log("PDOException on deleteSession: " . $e->getMessage());
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Database error occurred while deleting sessions.']);
        } catch (Exception $e) {
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Failed to delete sessions: ' . $e->getMessage()]);
        }
    }

    public function getTotalTravelDistance(): void
    {
        header('Content-Type: application/json');
        try {
            $totalDistance = $this->sessionRepository->getTotalTravelDistance();
            $this->sendJsonResponse(200, ['status' => 'success', 'text' => 'Total travel distance fetched successfully'], $totalDistance);
        } catch (PDOException $e) {
            error_log("PDOException on getTotalTravelDistance: " . $e->getMessage());
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Database error occurred while fetching total travel distance.']);
        } catch (Exception $e) {
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Failed to retrieve total travel distance: ' . $e->getMessage()]);
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
