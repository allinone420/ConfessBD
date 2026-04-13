export interface UserLocation {
  city: string;
  region: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export async function detectLocation(): Promise<UserLocation | null> {
  // Try multiple services in case one is blocked or down
  // api.db-ip.com and ipwho.is are generally more CORS-friendly
  const services = [
    { url: 'https://api.db-ip.com/v2/free/self', type: 'db-ip' },
    { url: 'https://ipwho.is/', type: 'ipwho' },
    { url: 'https://geolocation-db.com/json/', type: 'geodb' },
    { url: 'https://freeipapi.com/api/json', type: 'freeip' }
  ];

  for (const service of services) {
    try {
      console.log(`Attempting location fetch from: ${service.url}`);
      const response = await fetch(service.url, {
        // Using no-cache to avoid stale location data
        cache: 'no-cache',
      });
      
      if (!response.ok) {
        console.warn(`Service ${service.url} returned status: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`Data received from ${service.type}:`, data);
      
      if (data.success === false || data.error) {
        continue;
      }
      
      // Normalize data based on different service responses
      let city = '';
      let region = '';
      let country = '';
      let lat, lng;

      switch (service.type) {
        case 'db-ip':
          city = data.city;
          region = data.stateProv;
          country = data.countryName;
          break;
        case 'ipwho':
          city = data.city;
          region = data.region;
          country = data.country;
          lat = data.latitude;
          lng = data.longitude;
          break;
        case 'geodb':
          city = data.city;
          region = data.state;
          country = data.country_name;
          lat = data.latitude;
          lng = data.longitude;
          break;
        case 'freeip':
          city = data.cityName;
          region = data.regionName;
          country = data.countryName;
          lat = data.latitude;
          lng = data.longitude;
          break;
      }
      
      if (!city || city === 'Unknown') {
        continue;
      }

      return {
        city,
        region: region || '',
        country: country || '',
        latitude: lat,
        longitude: lng
      };
    } catch (error) {
      // If it's a fetch error (like CORS or network), just move to the next one
      console.warn(`Fetch error for ${service.url}. This is often due to ad-blockers or CORS.`);
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
