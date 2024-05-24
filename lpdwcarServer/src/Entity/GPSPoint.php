<?php

namespace App\Entity;

use DateTime;

class GPSPoint {
    private float $latitude;
    private float $longitude;
    private DateTime $recorded_at;

    public function __construct(float $latitude, float $longitude, string|DateTime $recordedAt) {
        $this->latitude = $latitude;
        $this->longitude = $longitude;
        $this->setRecordedAt($recordedAt);
    }

    public function getLatitude(): float {
        return $this->latitude;
    }

    public function getLongitude(): float {
        return $this->longitude;
    }

    public function getRecordedAt(): DateTime {
        return $this->recorded_at;
    }

    public function setRecordedAt($recorded_at): void {
        if (is_string($recorded_at)) {
            $this->recorded_at = new DateTime($recorded_at);
        } elseif ($recorded_at instanceof DateTime) {
            $this->recorded_at = $recorded_at;
        } else {
            throw new \InvalidArgumentException("Invalid type for recordedAt, must be a string or DateTime instance");
        }
    }

    public function toArray(): array
    {
        return [
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'recorded_at' => $this->recorded_at->format('Y-m-d H:i:s')

        ];
    }
}

