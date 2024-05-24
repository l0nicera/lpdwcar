export class Session {
  id;
  start_datetime;
  stop_datetime;
  start_coords;
  stop_coords;
  travel_distance;
  nighttime;
  weather;
  hazards= [];
  maneuvers= [];
  parkings= [];
  roadtypes= [];
  gps_points = [];

  constructor(data = {}) {
    this.id = data.id || null;
    this.start_datetime = typeof data.start_datetime === 'string' ? new Date(data.start_datetime) : data.start_datetime || null;
    this.stop_datetime = typeof data.stop_datetime === 'string' ? new Date(data.stop_datetime) : data.stop_datetime || null;
    this.start_coords = data.start_coords || null;
    this.stop_coords = data.stop_coords || null;
    this.travel_distance = parseInt(data.travel_distance) || null;
    this.nighttime = data.nighttime || null;
    this.weather = data.weather || null;
    this.hazards = data.hazards || [];
    this.maneuvers = data.maneuvers || [];
    this.parkings = data.parkings || [];
    this.roadtypes = data.roadtypes || [];
    this.gps_points = data.gps_points || [];
  }
}
export class BaseCondition {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

export class Weather extends BaseCondition{}

export class Hazard extends BaseCondition{}

export class Maneuver extends BaseCondition{}

export class Parking extends BaseCondition{}

export class Roadtype extends BaseCondition{}