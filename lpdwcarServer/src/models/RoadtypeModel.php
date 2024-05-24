<?php

namespace App\models;


require_once __DIR__ . '/BaseConditionModel.php';

class RoadtypeModel extends BaseConditionModel {

    public static function getTableName(): string {
        return 'roadtypes';
    }
}