// Real Kerala district boundaries sourced from:
// https://github.com/geohacker/kerala
// 2011 Census population density (persons per km²) added to each district.
import data from './keralaReal.json';

export const keralaDistricts = data as GeoJSON.FeatureCollection;
