
const GDACS_GEOJSON_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/map?eventtype=ALL&period=7";
const USGS_EARTHQUAKE_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=10";

export async function fetchGDACSIncidents() {
  try {
    const response = await fetch(GDACS_GEOJSON_URL);
    const data = await response.json();
    return data.features.map((feature: any) => ({
      id: feature.properties.eventid,
      title: feature.properties.name,
      location: feature.properties.country,
      severity: feature.properties.alertlevel === "red" ? 5 : feature.properties.alertlevel === "orange" ? 4 : 3,
      type: feature.properties.eventtype.toLowerCase(),
      phase: "active",
      timestamp: "Real-time",
      description: feature.properties.description,
      coords: feature.geometry.coordinates,
    }));
  } catch (error) {
    console.error("Error fetching GDACS incidents:", error);
    return [];
  }
}

export async function fetchUSGSIncidents() {
  try {
    const response = await fetch(USGS_EARTHQUAKE_URL);
    const data = await response.json();
    return data.features.map((feature: any) => ({
      id: feature.id,
      title: feature.properties.title,
      location: feature.properties.place,
      severity: feature.properties.mag >= 7 ? 5 : feature.properties.mag >= 5 ? 4 : 3,
      type: "earthquake",
      phase: "active",
      timestamp: new Date(feature.properties.time).toLocaleTimeString(),
      coords: feature.geometry.coordinates,
    }));
  } catch (error) {
    console.error("Error fetching USGS incidents:", error);
    return [];
  }
}
