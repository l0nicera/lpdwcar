<?php
namespace App\models;

use PDO;

class TranslationModel {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function fetchAll(): bool|array {
        $stmt = $this->pdo->prepare("SELECT key_name, language_code, translation FROM translations");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function fetchByLanguage($languageCode): bool|array {
        $stmt = $this->pdo->prepare("SELECT key_name, translation FROM translations WHERE language_code = :languageCode");
        $stmt->bindParam(':languageCode', $languageCode, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function fetchByKey($key): bool|array {
        $stmt = $this->pdo->prepare("SELECT key_name, language_code, translation FROM translations WHERE key_name = :key");
        $stmt->bindParam(':key', $key, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
