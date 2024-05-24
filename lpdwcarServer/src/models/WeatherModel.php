<?php

namespace App\models;


require_once __DIR__ . '/BaseConditionModel.php';

class WeatherModel extends BaseConditionModel  {

    public static function getTableName(): string {
        return 'weathers';
    }
}