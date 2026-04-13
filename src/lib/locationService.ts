export interface UserLocation {
  city: string;
  region: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export async function detectLocation(): Promise<UserLocation | null> {
  // 1. Try Browser Geolocation first (Most Accurate)
  try {
    const coords = await getBrowserLocation();
    if (coords) {
      // Reverse geocode using BigDataCloud (Free, no API key needed for client-side)
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lng}&localityLanguage=en`);
      if (response.ok) {
        const data = await response.json();
        const city = data.city || data.locality || data.principalSubdivision || 'Unknown';
        if (city !== 'Unknown') {
          return {
            city,
            region: data.principalSubdivision || '',
            country: data.countryName || '',
            latitude: coords.lat,
            longitude: coords.lng
          };
        }
      }
    }
  } catch (err) {
    console.warn('Browser geolocation or reverse geocoding failed:', err);
  }

  // 2. Fallback to IP-based location (Less Accurate)
  const services = [
    { url: 'https://ipwho.is/', type: 'ipwho' },
    { url: 'https://api.db-ip.com/v2/free/self', type: 'db-ip' },
    { url: 'https://geolocation-db.com/json/', type: 'geodb' }
  ];

  for (const service of services) {
    try {
      const response = await fetch(service.url);
      if (!response.ok) continue;
      
      const data = await response.json();
      if (data.success === false || data.error) continue;
      
      let city = '';
      let region = '';
      let country = '';
      let lat, lng;

      switch (service.type) {
        case 'ipwho':
          city = data.city;
          region = data.region;
          country = data.country;
          lat = data.latitude;
          lng = data.longitude;
          break;
        case 'db-ip':
          city = data.city;
          region = data.stateProv;
          country = data.countryName;
          break;
        case 'geodb':
          city = data.city;
          region = data.state;
          country = data.country_name;
          lat = data.latitude;
          lng = data.longitude;
          break;
      }
      
      if (city && city !== 'Unknown') {
        return { city, region: region || '', country: country || '', latitude: lat, longitude: lng };
      }
    } catch (error) {
      // Continue to next service
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
