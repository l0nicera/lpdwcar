<?php

namespace App\Services;

use DateTime;
use Exception;

class SessionValidator {
    public function validate(array $data): array {
        $errors = [];

        if (empty($data['start_datetime'])) {
            $errors['start_datetime'] = "La date et l'heure de départ sont obligatoires.";
        }

        if (empty($data['stop_datetime']) && empty($data['gps_points'])) {
            $errors['stop_datetime'] = "La date et l'heure d'arrivée sont obligatoires si aucun point GPS n'est fourni.";
        }

        if (!empty($data['travel_distance']) && (!is_numeric($data['travel_distance']) || $data['travel_distance'] < 1 || $data['travel_distance'] > 9999)) {
            $errors['travel_distance'] = "Veuillez entrer une distance valide (1 à 9999).";
        }

        try {
            $startDatetime = new DateTime($data['start_datetime']);
            if ($startDatetime->format('Y') < 1900 || $startDatetime->format('Y') > 2099) {
                $errors['start_datetime'] = "Les dates doivent être entre 1900 et 2099.";
            }

            if (!empty($data['stop_datetime'])) {
                $stopDatetime = new DateTime($data['stop_datetime']);
                if ($stopDatetime->format('Y') < 1900 || $stopDatetime->format('Y') > 2099) {
                    $errors['stop_datetime'] = "Les dates doivent être entre 1900 et 2099.";
                }

                if ($startDatetime >= $stopDatetime) {
                    $errors['datetime'] = "La date ou l'heure de départ doivent être inférieures à celle d'arrivée.";
                }
            }
        } catch (Exception $e) {
            $errors['datetime'] = "Format de date invalide : " . $e->getMessage();
        }

        return $errors;
    }
}
