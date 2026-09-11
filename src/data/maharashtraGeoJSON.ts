/**
 * GeoJSON polygon coordinates tracing the actual boundary of Maharashtra state, India.
 * Bounded approximately by 15.6°N - 22.1°N Latitude and 72.6°E - 80.9°E Longitude.
 */

export const MAHARASHTRA_GEOJSON: any = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Maharashtra",
        state_code: "MH",
        capital: "Mumbai",
        region: "Western India"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            // Coastal strip south to north (Sindhudurg -> Ratnagiri -> Raigad -> Mumbai -> Palghar)
            [73.68, 15.80], [73.50, 16.05], [73.30, 16.50], [73.15, 17.00],
            [73.18, 17.50], [72.95, 18.20], [72.80, 18.95], [72.78, 19.35],
            [72.72, 19.85], [72.70, 20.10],
            // Northern border along Gujarat and MP (Nandurbar -> Dhule -> Jalgaon -> Amravati -> Nagpur)
            [73.80, 20.50], [74.05, 21.30], [74.20, 21.65], [74.50, 21.90],
            [75.10, 21.50], [75.80, 21.40], [76.50, 21.30], [77.20, 21.55],
            [77.70, 21.40], [78.60, 21.50], [79.20, 21.65], [79.80, 21.45],
            // Eastern Vidarbha border along MP and Chhattisgarh (Bhandara -> Gondia -> Gadchiroli)
            [80.30, 21.40], [80.70, 21.10], [80.50, 20.50], [80.80, 19.80],
            [80.50, 19.00], [80.10, 18.70],
            // Southern border along Telangana, Karnataka and Goa (Gadchiroli -> Chandrapur -> Nanded -> Latur -> Solapur -> Sangli -> Kolhapur -> Sindhudurg)
            [79.80, 18.90], [79.20, 19.40], [78.50, 19.30], [77.90, 18.90],
            [77.30, 18.60], [76.80, 18.10], [76.20, 17.80], [75.60, 17.40],
            [75.10, 17.00], [74.40, 16.70], [74.15, 16.10], [73.90, 15.80],
            [73.68, 15.80]
          ]
        ]
      }
    }
  ]
};
