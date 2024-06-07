<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');


if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../src/Infrastructure/Database.php';
require_once __DIR__ . '/../src/Controllers/SessionController.php';
require_once __DIR__ . '/../src/Controllers/ConditionController.php';
require_once __DIR__ . '/../src/Controllers/TranslationController.php';
require_once __DIR__ . '/../src/Infrastructure/Repository/SessionRepository.php';
require_once __DIR__ . '/../src/Infrastructure/Repository/WeatherRepository.php';
require_once __DIR__ . '/../src/Infrastructure/Repository/HazardRepository.php';
require_once __DIR__ . '/../src/Infrastructure/Repository/ManeuverRepository.php';
require_once __DIR__ . '/../src/Infrastructure/Repository/ParkingRepository.php';
require_once __DIR__ . '/../src/Infrastructure/Repository/RoadTypeRepository.php';
require_once __DIR__ . '/../src/Services/SessionValidator.php';
require_once __DIR__ . '/../src/Core/Response.php';

use App\Core\Response;
use App\Controllers\ConditionController;
use App\Controllers\SessionController;
use App\Controllers\TranslationController;
use App\Infrastructure\Database;
use App\Infrastructure\Repository\HazardRepository;
use App\Infrastructure\Repository\ManeuverRepository;
use App\Infrastructure\Repository\ParkingRepository;
use App\Infrastructure\Repository\RoadTypeRepository;
use App\Infrastructure\Repository\SessionRepository;
use App\Infrastructure\Repository\WeatherRepository;
use App\Services\SessionValidator;


$pdo = Database::getPDO();


$basePathPattern = '/^\/api\//';
$requestUri = preg_replace($basePathPattern, '', $_SERVER['REQUEST_URI']);
$requestUri = trim($requestUri, '/');


$sessionRepository = new SessionRepository($pdo);
$weatherRepository = new WeatherRepository($pdo);
$hazardRepository = new HazardRepository($pdo);
$maneuverRepository = new ManeuverRepository($pdo);
$parkingRepository = new ParkingRepository($pdo);
$roadTypeRepository = new RoadTypeRepository($pdo);
$validator = new SessionValidator();
$sessionController = new SessionController($sessionRepository, $weatherRepository, $hazardRepository, $maneuverRepository, $parkingRepository, $roadTypeRepository, $validator);
$conditionController = new ConditionController($weatherRepository, $hazardRepository, $maneuverRepository, $parkingRepository, $roadTypeRepository);
$translationController = new TranslationController($pdo);

//***** Session routes *****//
if ($requestUri == 'session/save') {
    $sessionController->saveSession();
} elseif ($requestUri == 'session/all') {
    $sessionController->getSessions();
} elseif ($requestUri == 'session/distance') {
    $sessionController->getTotalTravelDistance();
}elseif (preg_match('/^session\/get\/(\d+)$/', $requestUri, $matches)) {
    $sessionId = $matches[1];
    $sessionController->getSession($sessionId);
} elseif (preg_match('/^session\/delete\/(\d+)$/', $requestUri, $matches)) {
    $sessionId = $matches[1];
    $sessionController->deleteSession($sessionId);

}
//***** Condition routes *****//
elseif ($requestUri == 'conditions/all') {
    // Là j'appelle mon render puisque je récupère un object de type Response ;)
    $conditionController->getAllConditions()->render();
} elseif ($requestUri == 'translations/all') {
    $translationController->getAllTranslations();
}
elseif (preg_match('/^translations\/(\w+)$/', $requestUri, $matches)) {
    $translationController->getTranslationsByLanguage($matches[1]);
}

else {
    Response::notFound()->render();
}

// Et si tu renvoie des Response de partout, tu as juste à stocker 
// la Response dans une var, et à la fin faire un $resp->render()

