export interface UserLocation {
  city: string;
  region: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export async function detectLocation(): Promise<UserLocation | null> {
  // Try multiple services in case one is blocked or down
  // geolocation-db.com is very CORS friendly
  const services = [
    'https://geolocation-db.com/json/',
    'https://freeipapi.com/api/json',
    'https://ipwho.is/',
    'https://ipapi.co/json/'
  ];

  for (const url of services) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      
      const data = await response.json();
      
      // Some APIs return success: false instead of 4xx/5xx
      if (data.success === false) continue;
      
      // Normalize data based on different service responses
      const city = data.city || data.cityName || data.city_name || 'Unknown';
      
      // If city is unknown, this service didn't give us what we need
      if (city === 'Unknown' || !city) continue;

      return {
        city: city,
        region: data.region || data.regionName || data.region_name || data.state || '',
        country: data.country_name || data.countryName || data.country || '',
        latitude: data.latitude || data.lat,
        longitude: data.longitude || data.lng || data.lon
      };
    } catch (error) {
      // Silent fail for individual services
    }
  }

  return null;
}

export async function getBrowserLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        resolve(null);
      },
      { timeout: 5000 }
    );
  });
}
