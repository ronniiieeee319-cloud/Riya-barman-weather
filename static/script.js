/* ===================================
   Riya Barman Weather App - FIXED
   =================================== */

let isCelsius = true;
let currentWeatherData = null;

/* DOM Elements */
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loadingContainer = document.getElementById('loadingContainer');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const weatherContainer = document.getElementById('weatherContainer');
const animatedBackground = document.getElementById('animatedBackground');
const tempToggle = document.getElementById('tempToggle');
const themeToggle = document.getElementById('themeToggle');

/* Weather Icons */
const weatherIcons = {
    '01d': 'fa-sun', '01n': 'fa-moon',
    '02d': 'fa-cloud-sun', '02n': 'fa-cloud-moon',
    '03d': 'fa-cloud', '03n': 'fa-cloud',
    '04d': 'fa-cloud', '04n': 'fa-cloud',
    '09d': 'fa-cloud-rain', '09n': 'fa-cloud-rain',
    '10d': 'fa-cloud-showers-heavy', '10n': 'fa-cloud-showers-heavy',
    '11d': 'fa-cloud-bolt', '11n': 'fa-cloud-bolt',
    '13d': 'fa-snowflake', '13n': 'fa-snowflake',
    '50d': 'fa-smog', '50n': 'fa-smog'
};

/* Initialize */
function init() {
    console.log('App initializing...');
    
    createParticles();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    // Load theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Load last city
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        fetchWeatherByCity(lastCity);
    } else {
        // Try to get user location
        getCurrentLocationWeather();
    }
    
    // Event listeners
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
        console.log('Search button listener added');
    }
    
    if (locationBtn) {
        locationBtn.addEventListener('click', getCurrentLocationWeather);
        console.log('Location button listener added');
    }
    
    if (tempToggle) {
        tempToggle.addEventListener('click', toggleTemperature);
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    if (cityInput) {
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    console.log('App initialized successfully');
}

/* Create Particles */
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 1}px;
            height: ${Math.random() * 4 + 1}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: particleFloat ${Math.random() * 10 + 10}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
            pointer-events: none;
        `;
        particlesContainer.appendChild(particle);
    }
    
    // Add animation keyframes
    if (!document.getElementById('particle-style')) {
        const style = document.createElement('style');
        style.id = 'particle-style';
        style.textContent = `
            @keyframes particleFloat {
                0% { transform: translateY(0) translateX(0); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

/* Update DateTime */
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const dateTimeElement = document.getElementById('dateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

/* Toggle Theme */
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    if (themeToggle) {
        themeToggle.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

/* Handle Search */
function handleSearch() {
    const city = cityInput.value.trim();
    console.log('Search button clicked, city:', city);
    
    if (city === '') {
        showError('Please enter a city name');
        return;
    }
    
    fetchWeatherByCity(city);
    cityInput.value = '';
}

/* Get Current Location */
function getCurrentLocationWeather() {
    console.log('Location button clicked');
    
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }
    
    showLoading();
    
    if (locationBtn) {
        locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Getting location...</span>';
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            console.log('Got location:', position.coords);
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
            if (locationBtn) {
                locationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i><span>My Location</span>';
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            showError('Unable to get your location. Please search manually.');
            if (locationBtn) {
                locationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i><span>My Location</span>';
            }
        }
    );
}

/* Fetch Weather by City */
async function fetchWeatherByCity(city) {
    console.log('Fetching weather for city:', city);
    showLoading();
    
    try {
        const response = await fetch(`/api/weather/city/${encodeURIComponent(city)}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Unable to fetch weather data');
        }
        
        const data = await response.json();
        console.log('Weather data received:', data);
        displayWeather(data);
        localStorage.setItem('lastCity', city);
        
    } catch (error) {
        console.error('Fetch error:', error);
        showError(error.message);
    }
}

/* Fetch Weather by Coords */
async function fetchWeatherByCoords(lat, lon) {
    console.log('Fetching weather for coords:', lat, lon);
    showLoading();
    
    try {
        const response = await fetch(`/api/weather/coordinates?lat=${lat}&lon=${lon}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error('Unable to fetch weather data for your location.');
        }
        
        const data = await response.json();
        console.log('Weather data received:', data);
        displayWeather(data);
        localStorage.setItem('lastCity', data.name);
        
    } catch (error) {
        console.error('Fetch error:', error);
        showError(error.message);
    }
}

/* Show Loading */
function showLoading() {
    console.log('Showing loading...');
    if (weatherContainer) weatherContainer.classList.remove('active');
    if (errorMessage) errorMessage.classList.remove('active');
    if (loadingContainer) loadingContainer.classList.add('active');
}

/* Show Error */
function showError(message) {
    console.log('Showing error:', message);
    if (loadingContainer) loadingContainer.classList.remove('active');
    if (weatherContainer) weatherContainer.classList.remove('active');
    if (errorText) errorText.textContent = message;
    if (errorMessage) errorMessage.classList.add('active');
    
    setTimeout(() => {
        if (errorMessage) errorMessage.classList.remove('active');
    }, 5000);
}

/* Close Error */
function closeError() {
    if (errorMessage) errorMessage.classList.remove('active');
}

/* Display Weather */
function displayWeather(data) {
    console.log('Displaying weather data:', data);
    currentWeatherData = data;
    
    if (loadingContainer) loadingContainer.classList.remove('active');
    if (errorMessage) errorMessage.classList.remove('active');
    
    // Update location
    const cityNameEl = document.getElementById('cityName');
    const countryEl = document.getElementById('country');
    if (cityNameEl) cityNameEl.textContent = data.name;
    if (countryEl) countryEl.textContent = data.sys.country;
    
    // Store temperature data
    currentWeatherData.temperature = data.main.temp;
    currentWeatherData.feelsLike = data.main.feels_like;
    
    // Update temperature display
    updateTemperatureDisplay();
    
    // Update weather description
    const descEl = document.getElementById('weatherDescription');
    if (descEl) descEl.textContent = data.weather[0].description;
    
    // Update details
    const humidityEl = document.getElementById('humidity');
    if (humidityEl) humidityEl.textContent = `${data.main.humidity}%`;
    
    const windSpeedEl = document.getElementById('windSpeed');
    if (windSpeedEl) {
        const windSpeedKmh = Math.round(data.wind.speed * 3.6);
        windSpeedEl.textContent = `${windSpeedKmh} km/h`;
    }
    
    const visibilityEl = document.getElementById('visibility');
    if (visibilityEl) {
        const visibilityKm = (data.visibility / 1000).toFixed(1);
        visibilityEl.textContent = `${visibilityKm} km`;
    }
    
    const pressureEl = document.getElementById('pressure');
    if (pressureEl && data.main.pressure) {
        pressureEl.textContent = `${data.main.pressure} hPa`;
    }
    
    // Update weather icon
    updateWeatherIcon(data.weather[0].icon);
    
    // Update background
    const weatherMain = data.weather[0].main.toLowerCase();
    updateBackground(weatherMain);
    
    // Show weather container
    if (weatherContainer) weatherContainer.classList.add('active');
    
    console.log('Weather displayed successfully');
}

/* Update Temperature Display */
function updateTemperatureDisplay() {
    if (!currentWeatherData) return;
    
    let temp = currentWeatherData.temperature;
    let feelsLike = currentWeatherData.feelsLike;
    
    if (!isCelsius) {
        temp = (temp * 9/5) + 32;
        feelsLike = (feelsLike * 9/5) + 32;
    }
    
    const unit = isCelsius ? '°C' : '°F';
    
    const tempEl = document.getElementById('temperature');
    const feelsLikeEl = document.getElementById('feelsLike');
    
    if (tempEl) tempEl.textContent = `${Math.round(temp)}°`;
    if (feelsLikeEl) feelsLikeEl.textContent = `${Math.round(feelsLike)}${unit}`;
}

/* Toggle Temperature */
function toggleTemperature() {
    isCelsius = !isCelsius;
    if (tempToggle) tempToggle.classList.toggle('fahrenheit');
    updateTemperatureDisplay();
}

/* Update Weather Icon */
function updateWeatherIcon(iconCode) {
    const iconContainer = document.getElementById('weatherIconContainer');
    if (!iconContainer) return;
    
    const iconClass = weatherIcons[iconCode] || 'fa-sun';
    iconContainer.innerHTML = `<i class="fas ${iconClass}"></i>`;
}

/* Update Background */
function updateBackground(condition) {
    if (!animatedBackground) return;
    
    animatedBackground.className = 'animated-background';
    
    const conditionMap = {
        'clear': 'clear',
        'clouds': 'cloudy',
        'rain': 'rainy',
        'drizzle': 'rainy',
        'thunderstorm': 'thunderstorm',
        'snow': 'snowy',
        'mist': 'cloudy',
        'fog': 'cloudy',
        'haze': 'cloudy'
    };
    
    const backgroundClass = conditionMap[condition] || 'clear';
    animatedBackground.classList.add(backgroundClass);
}

/* Initialize on DOM Load */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('Script loaded successfully');
