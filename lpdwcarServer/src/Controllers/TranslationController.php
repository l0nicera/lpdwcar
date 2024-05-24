<?php
namespace App\Controllers;

require_once __DIR__ . '/../models/TranslationModel.php';
use App\Models\TranslationModel;
use Exception;
use PDO;
use PDOException;

class TranslationController {
    private TranslationModel $translationModel;

    public function __construct(PDO $pdo) {
        $this->translationModel = new TranslationModel($pdo);
    }

    public function getAllTranslations(): void {
        header('Content-Type: application/json');
        try {
            $translations = $this->translationModel->fetchAll();
            if (is_array($translations)) {
                $this->sendJsonResponse(200, ['status' => 'success', 'text' => 'Translations fetched successfully'], $translations);
            } else {
                $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Unexpected error occurred while fetching translations.']);
            }
        } catch (PDOException $e) {
            error_log("PDOException on getAllTranslations: " . $e->getMessage());
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Database error occurred while fetching translations.']);
        } catch (Exception $e) {
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Failed to retrieve translations: ' . $e->getMessage()]);
        }
    }

    public function getTranslationsByLanguage($languageCode): void {
        header('Content-Type: application/json');

        if (empty($languageCode)) {
            $this->sendJsonResponse(400, ['status' => 'error', 'text' => 'Language code is required.']);
            return;
        }

        try {
            $translations = $this->translationModel->fetchByLanguage($languageCode);
            if (is_array($translations)) {
                $this->sendJsonResponse(200, ['status' => 'success', 'text' => 'Translations fetched successfully for language code: ' . $languageCode], $translations);
            } else {
                $this->sendJsonResponse(404, ['status' => 'error', 'text' => 'Translations not found for language code: ' . $languageCode]);
            }
        } catch (PDOException $e) {
            error_log("PDOException on getTranslationsByLanguage: " . $e->getMessage());
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Database error occurred while fetching translations for language code: ' . $languageCode]);
        } catch (Exception $e) {
            $this->sendJsonResponse(500, ['status' => 'error', 'text' => 'Failed to retrieve translations: ' . $e->getMessage()]);
        }
    }

    private function sendJsonResponse($status, $message, $data = null): void {
        header('Content-Type: application/json');
        http_response_code($status);
        $response = ['status' => $message['status'], 'message' => $message['text']];
        if ($data !== null) {
            $response['data'] = $data;
        }
        echo json_encode($response);
    }
}
