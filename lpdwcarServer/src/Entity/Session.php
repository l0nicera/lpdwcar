<?php

namespace App\Entity;

require_once __DIR__ . '/GPSPoint.php';
require_once __DIR__ . '/../Infrastructure/Repository/WeatherRepository.php';
require_once __DIR__ . '/../Infrastructure/Repository/HazardRepository.php';
require_once __DIR__ . '/../Infrastructure/Repository/ManeuverRepository.php';
require_once __DIR__ . '/../Infrastructure/Repository/ParkingRepository.php';
require_once __DIR__ . '/../Infrastructure/Repository/RoadTypeRepository.php';


use App\Infrastructure\Repository\HazardRepository;
use App\Infrastructure\Repository\ManeuverRepository;
use App\Infrastructure\Repository\ParkingRepository;
use App\Infrastructure\Repository\RoadTypeRepository;
use App\Infrastructure\Repository\WeatherRepository;
use DateTime;

class Session
{
    private ?int $id = null;
    private DateTime $startDatetime;
    private DateTime $stopDatetime;
    private ?string $startCoords = null;
    private ?string $stopCoords = null;
    private int $travelDistance;
    private ?bool $nighttime = null;
    private ?Weather $weather = null;
    private WeatherRepository $weatherRepository;
    private ?array $hazards = [];
    private HazardRepository $hazardRepository;
    private ?array $maneuvers = [];
    private ManeuverRepository $maneuverRepository;
    private ?array $parkings = [];
    private ParkingRepository $parkingRepository;
    private ?array $roadtypes = [];
    private RoadTypeRepository $roadTypeRepository;
    private ?array $gpsPoints = [];

    public function __construct(
        array $data,
        WeatherRepository $weatherRepository,
        HazardRepository $hazardRepository,
        ManeuverRepository $maneuverRepository,
        ParkingRepository $parkingRepository,
        RoadTypeRepository $roadTypeRepository
    )
    {
        $this->setId($data['id'] ?? null);
        $this->setStartDatetime($data['start_datetime'] ?? '');
        $this->setStartCoords($data['start_coords'] ?? null);
        $this->setStopCoords($data['stop_coords'] ?? null);
        $this->setTravelDistance($data['travel_distance'] ?? 1);
        $this->setNighttime($data['nighttime'] ?? null);
        $this->setGpsPoints($data['gps_points'] ?? []);
        $this->setStopDatetime($data['stop_datetime'] ?? '');

        $this->weatherRepository = $weatherRepository;
        $this->hazardRepository = $hazardRepository;
        $this->maneuverRepository = $maneuverRepository;
        $this->parkingRepository = $parkingRepository;
        $this->roadTypeRepository = $roadTypeRepository;

        $weather = $data['weather'] ?? $data['weather_id'] ?? null;
        $this->setWeather($weather);
        $this->setHazards($data['hazards'] ?? []);
        $this->setManeuvers($data['maneuvers'] ?? []);
        $this->setParkings($data['parkings'] ?? []);
        $this->setRoadTypes($data['roadtypes'] ?? []);
    }

    // Getters
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getStartDatetime(): DateTime
    {
        return $this->startDatetime;
    }

    public function getStopDatetime(): DateTime
    {
        return $this->stopDatetime;
    }

    public function getStartCoords(): ?string
    {
        return $this->startCoords;
    }

    public function getStopCoords(): ?string
    {
        return $this->stopCoords;
    }

    public function getTravelDistance(): int
    {
        return $this->travelDistance;
    }

    public function getNighttime(): ?bool
    {
        return $this->nighttime;
    }

    public function getWeather(): ?Weather
    {
        return $this->weather;
    }

    public function getHazards(): array {
        return $this->hazards;
    }

    public function getManeuvers(): array {
        return $this->maneuvers;
    }

    public function getParkings(): array {
        return $this->parkings;
    }

    public function getRoadTypes(): array {
        return $this->roadtypes;
    }

    public function getGpsPoints(): array {
        return $this->gpsPoints;
    }

    // Setters
    public function setId(?int $id): void
    {
        $this->id = $id;
    }

    public function setStartDatetime($startDatetime): void
    {
        if (empty($startDatetime)) {
            throw new \InvalidArgumentException("startDatetime cannot be null or empty.");
        }
        if (is_string($startDatetime)) {
            $this->startDatetime = new DateTime($startDatetime);
        } elseif ($startDatetime instanceof DateTime) {
            $this->startDatetime = $startDatetime;
        } else {
            throw new \InvalidArgumentException("Invalid type for startDatetime");
        }
    }


    public function setStopDatetime($stopDatetime): void
    {
        if (empty($stopDatetime) && empty($this->gpsPoints)) {
            throw new \InvalidArgumentException("stopDatetime cannot be null when no GPS points are available.");
        }
        if (empty($stopDatetime)) {
            $lastGpsPoint = end($this->gpsPoints);
            $stopDatetime = $lastGpsPoint ? $lastGpsPoint->getRecordedAt() : new DateTime();
        }

        if (is_string($stopDatetime)) {
            $stopDatetime = new DateTime($stopDatetime);
        } elseif (!$stopDatetime instanceof DateTime) {
            throw new \InvalidArgumentException("Invalid type for stopDatetime");
        }

        if (isset($this->startDatetime) && $stopDatetime <= $this->startDatetime) {
            throw new \InvalidArgumentException("Stop datetime must be after start datetime.");
        }

        $this->stopDatetime = $stopDatetime;
    }



    public function setStartCoords(?string $startCoords): void
    {
        $this->startCoords = $startCoords;
    }

    public function setStopCoords(?string $stopCoords): void
    {
        $this->stopCoords = $stopCoords;
    }

    public function setTravelDistance(int $travelDistance): void
    {
        if ($travelDistance <= 0) {
            $this->travelDistance = 1;
            //TODO: throw new \InvalidArgumentException("Travel distance must be greater than zero.");
        } else {
            $this->travelDistance = $travelDistance;
        }
    }

    public function setNighttime(?bool $nighttime): void
    {
        $this->nighttime = $nighttime;
    }

    public function setWeather($weather): void {
        if ($weather === null || $weather === '') {
            $this->weather = null;
        } elseif ($weather instanceof Weather) {
            $this->weather = $weather;
        } elseif (is_numeric($weather)) {
            $fetchedWeather = $this->weatherRepository->findWeatherById($weather);
            if ($fetchedWeather !== null) {
                $this->weather = $fetchedWeather;
            } else {
                throw new \InvalidArgumentException("No weather found with ID: $weather");
            }
        } else {
            throw new \InvalidArgumentException("Invalid type for weather, must be an instance of Weather or a numeric ID");
        }
    }


    public function setHazards($hazards): void {
        if (empty($hazards)) {
            $this->hazards = [];
        } elseif (is_array($hazards) && isset($hazards[0]) && $hazards[0] instanceof Hazard) {
            $this->hazards = $hazards;
        } elseif (is_array($hazards) && is_numeric($hazards[0])) {
            $fetchedHazards = $this->hazardRepository->findConditionsById($hazards);
            if (!empty($fetchedHazards)) {
                $this->hazards = $fetchedHazards;
            } else {
                throw new \InvalidArgumentException("No hazards found with the provided IDs");
            }
        } else {
            throw new \InvalidArgumentException("Invalid type for hazards, must be an array of Hazard objects or an array of IDs");
        }
    }

    public function setManeuvers($maneuvers): void {
        if (empty($maneuvers)) {
            $this->maneuvers = [];
        } elseif (is_array($maneuvers) && isset($maneuvers[0]) && $maneuvers[0] instanceof Maneuver) {
            $this->maneuvers = $maneuvers;
        } elseif (is_array($maneuvers) && is_numeric($maneuvers[0])) {
            $fetchedManeuvers = $this->maneuverRepository->findConditionsById($maneuvers);
            if (!empty($fetchedManeuvers)) {
                $this->maneuvers = $fetchedManeuvers;
            } else {
                throw new \InvalidArgumentException("No maneuvers found with the provided IDs");
            }
        } else {
            throw new \InvalidArgumentException("Invalid type for maneuvers, must be an array of Maneuver objects or an array of IDs");
        }
    }

    public function setParkings($parkings): void {
        if (empty($parkings)) {
            $this->parkings = [];
        } elseif (is_array($parkings) && isset($parkings[0]) && $parkings[0] instanceof Parking) {
            $this->parkings = $parkings;
        } elseif (is_array($parkings) && is_numeric($parkings[0])) {
            $fetchedParkings = $this->parkingRepository->findConditionsById($parkings);
            if (!empty($fetchedParkings)) {
                $this->parkings = $fetchedParkings;
            } else {
                throw new \InvalidArgumentException("No parkings found with the provided IDs");
            }
        } else {
            throw new \InvalidArgumentException("Invalid type for parkings, must be an array of Parking objects or an array of IDs");
        }
    }

    public function setRoadTypes($roadtypes): void {
        if (empty($roadtypes)) {
            $this->roadtypes = [];
        } elseif (is_array($roadtypes) && isset($roadtypes[0]) && $roadtypes[0] instanceof RoadType) {
            $this->roadtypes = $roadtypes;
        } elseif (is_array($roadtypes) && is_numeric($roadtypes[0])) {
            $fetchedRoadtypes = $this->roadTypeRepository->findConditionsById($roadtypes);
            if (!empty($fetchedRoadtypes)) {
                $this->roadtypes = $fetchedRoadtypes;
            } else {
                throw new \InvalidArgumentException("No roadtypes found with the provided IDs");
            }
        } else {
            throw new \InvalidArgumentException("Invalid type for roadtypes, must be an array of RoadType objects or an array of IDs");
        }
    }

    public function setGpsPoints(array $gpsPoints): void {
        $this->gpsPoints = [];
        foreach ($gpsPoints as $point) {
            if (is_array($point)) {
                $this->gpsPoints[] = new GPSPoint($point['lat'], $point['lng'], $point['recordedAt']);
            } else if ($point instanceof GPSPoint) {
                $this->gpsPoints[] = $point;
            } else {
                throw new \InvalidArgumentException('Invalid type for GPS points, must be an instance of GPSPoint or an associative array');
            }
        }
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'start_datetime' => $this->startDatetime->format('Y-m-d H:i:s'),
            'stop_datetime' => $this->stopDatetime->format('Y-m-d H:i:s'),
            'start_coords' => $this->startCoords,
            'stop_coords' => $this->stopCoords,
            'travel_distance' => $this->travelDistance,
            'nighttime' => $this->nighttime,
            'weather' => $this->weather?->toArray(),
            'hazards' => array_map(function ($hazard) { return $hazard->toArray(); }, $this->hazards),
            'maneuvers' => array_map(function ($maneuver) { return $maneuver->toArray(); }, $this->maneuvers),
            'parkings' => array_map(function ($parking) { return $parking->toArray(); }, $this->parkings),
            'roadtypes' => array_map(function ($roadType) { return $roadType->toArray(); }, $this->roadtypes),
            'gps_points' => array_map(function ($gpsPoint) { return $gpsPoint->toArray(); }, $this->gpsPoints)
        ];
    }


}
