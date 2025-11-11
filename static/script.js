/* ===================================
   Riya Barman Weather App - Enhanced Frontend
   Premium Edition with Advanced Features
   =================================== */

let isCelsius = true;
let currentWeatherData = null;
let forecastData = null;

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

/* Weather Icon Mapping */
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

/* Wind Direction Helper */
function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(degrees / 45) % 8];
}

/* Calculate Dew Point */
function calculateDewPoint(temp, humidity) {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
    return Math.round((b * alpha) / (a - alpha));
}

/* Service Worker Registration */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('Service Worker registered:', reg.scope))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}

/* Initialize Particles */
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
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
        `;
        particlesContainer.appendChild(particle);
    }
    
    const style = document.createElement('style');
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

/* Initialize Application */
function init() {
    createParticles();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    // Load theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Load last city
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        fetchWeatherByCity(lastCity);
    } else {
        getCurrentLocationWeather();
    }
    
    // Event listeners
    searchBtn.addEventListener('click', handleSearch);
    locationBtn.addEventListener('click', getCurrentLocationWeather);
    tempToggle.addEventListener('click', toggleTemperature);
    themeToggle.addEventListener('click', toggleTheme);
    
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
}

/* Update Date and Time */
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('dateTime').textContent = now.toLocaleDateString('en-US', options);
}

/* Toggle Theme */
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    themeToggle.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

/* Get Current Location Weather */
function getCurrentLocationWeather() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }
    
    showLoading();
    locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Getting location...</span>';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
            locationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i><span>My Location</span>';
        },
        (error) => {
            showError('Unable to get your location. Please search manually.');
            locationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i><span>My Location</span>';
            console.error('Geolocation error:', error);
        }
    );
}

/* Handle Search */
function handleSearch() {
    const city = cityInput.value.trim();
    if (city === '') return;
    
    fetchWeatherByCity(city);
    cityInput.value = '';
}

/* Fetch Weather by City */
async function fetchWeatherByCity(city) {
    showLoading();
    
    try {
        const response = await fetch(`/api/weather/city/${encodeURIComponent(city)}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Unable to fetch weather data');
        }
        
        const data = await response.json();
        displayWeather(data);
        fetchForecast(city);
        localStorage.setItem('lastCity', city);
        
    } catch (error) {
        showError(error.message);
        console.error('Fetch error:', error);
    }
}

/* Fetch Weather by Coordinates */
async function fetchWeatherByCoords(lat, lon) {
    showLoading();
    
    try {
        const response = await fetch(`/api/weather/coordinates?lat=${lat}&lon=${lon}`);
        
        if (!response.ok) {
            throw new Error('Unable to fetch weather data for your location.');
        }
        
        const data = await response.json();
        displayWeather(data);
        fetchForecast(data.name);
        localStorage.setItem('lastCity', data.name);
        
    } catch (error) {
        showError(error.message);
        console.error('Fetch error:', error);
    }
}

/* Fetch Forecast */
async function fetchForecast(city) {
    try {
        const response = await fetch(`/api/forecast/${encodeURIComponent(city)}`);
        if (response.ok) {
            forecastData = await response.json();
            displayForecast();
        }
    } catch (error) {
        console.error('Forecast fetch error:', error);
    }
}

/* Show Loading */
function showLoading() {
    weatherContainer.classList.remove('active');
    errorMessage.classList.remove('active');
    loadingContainer.classList.add('active');
}

/* Show Error */
function showError(message) {
    loadingContainer.classList.remove('active');
    weatherContainer.classList.remove('active');
    errorText.textContent = message;
    errorMessage.classList.add('active');
    
    setTimeout(() => {
        errorMessage.classList.remove('active');
    }, 5000);
}

/* Close Error */
function closeError() {
    errorMessage.classList.remove('active');
}

/* Display Weather */
function displayWeather(data) {
    currentWeatherData = data;
    loadingContainer.classList.remove('active');
    errorMessage.classList.remove('active');
    
    // Update location
    document.getElementById('cityName').textContent = data.name;
    document.getElementById('country').textContent = data.sys.country;
    
    // Update temperature
    const temp = data.main.temp;
    const feelsLike = data.main.feels_like;
    const tempMin = data.main.temp_min;
    const tempMax = data.main.temp_max;
    
    currentWeatherData.temperature = temp;
    currentWeatherData.feelsLike = feelsLike;
    currentWeatherData.tempMin = tempMin;
    currentWeatherData.tempMax = tempMax;
    
    updateTemperatureDisplay();
    
    // Update weather description
    document.getElementById('weatherDescription').textContent = data.weather[0].description;
    
    // Update weather details
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('humidityBar').style.width = `${data.main.humidity}%`;
    
    const windSpeedKmh = Math.round(data.wind.speed * 3.6);
    document.getElementById('windSpeed').textContent = `${windSpeedKmh} km/h`;
    document.getElementById('windDirection').textContent = `Direction: ${getWindDirection(data.wind.deg)}`;
    
    const visibilityKm = (data.visibility / 1000).toFixed(1);
    document.getElementById('visibility').textContent = `${visibilityKm} km`;
    
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    
    const cloudiness = data.clouds.all;
    document.getElementById('cloudiness').textContent = `${cloudiness}%`;
    document.getElementById('cloudinessBar').style.width = `${cloudiness}%`;
    
    const dewPoint = calculateDewPoint(temp, data.main.humidity);
    const dewPointUnit = isCelsius ? '°C' : '°F';
    const dewPointDisplay = isCelsius ? dewPoint : Math.round((dewPoint * 9/5) + 32);
    document.getElementById('dewPoint').textContent = `${dewPointDisplay}${dewPointUnit}`;
    
    // Update sun times
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);
    document.getElementById('sunrise').textContent = sunrise.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
    document.getElementById('sunset').textContent = sunset.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
    
    // Update weather icon
    updateWeatherIcon(data.weather[0].icon);
    
    // Update background
    const weatherMain = data.weather[0].main.toLowerCase();
    updateBackground(weatherMain);
    
    weatherContainer.classList.add('active');
}

/* Display Forecast */
function displayForecast() {
    if (!forecastData) return;
    
    const container = document.getElementById('forecastContainer');
    container.innerHTML = '';
    
    forecastData.forecast.forEach(item => {
        const time = new Date(item.dt * 1000);
        const hour = time.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
        
        const temp = isCelsius ? item.temp : Math.round((item.temp * 9/5) + 32);
        const unit = isCelsius ? '°C' : '°F';
        
        const iconClass = weatherIcons[item.icon] || 'fa-sun';
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-time">${hour}</div>
            <div class="forecast-icon"><i class="fas ${iconClass}"></i></div>
            <div class="forecast-temp">${temp}${unit}</div>
        `;
        container.appendChild(forecastItem);
    });
}

/* Update Temperature Display */
function updateTemperatureDisplay() {
    if (!currentWeatherData) return;
    
    let temp = currentWeatherData.temperature;
    let feelsLike = currentWeatherData.feelsLike;
    let tempMin = currentWeatherData.tempMin;
    let tempMax = currentWeatherData.tempMax;
    
    if (!isCelsius) {
        temp = (temp * 9/5) + 32;
        feelsLike = (feelsLike * 9/5) + 32;
        tempMin = (tempMin * 9/5) + 32;
        tempMax = (tempMax * 9/5) + 32;
    }
    
    const unit = isCelsius ? '°C' : '°F';
    document.getElementById('temperature').textContent = `${Math.round(temp)}°`;
    document.getElementById('feelsLike').textContent = `${Math.round(feelsLike)}${unit}`;
    document.getElementById('tempMax').textContent = `${Math.round(tempMax)}°`;
    document.getElementById('tempMin').textContent = `${Math.round(tempMin)}°`;
    
    // Update dew point
    if (currentWeatherData.main) {
        const dewPoint = calculateDewPoint(currentWeatherData.temperature, currentWeatherData.main.humidity);
        const dewPointDisplay = isCelsius ? dewPoint : Math.round((dewPoint * 9/5) + 32);
        document.getElementById('dewPoint').textContent = `${dewPointDisplay}${unit}`;
    }
    
    // Update forecast if available
    if (forecastData) {
        displayForecast();
    }
}

/* Toggle Temperature */
function toggleTemperature() {
    isCelsius = !isCelsius;
    tempToggle.classList.toggle('fahrenheit');
    updateTemperatureDisplay();
}

/* Update Weather Icon */
function updateWeatherIcon(iconCode) {
    const iconContainer = document.getElementById('weatherIconContainer');
    const iconClass = weatherIcons[iconCode] || 'fa-sun';
    iconContainer.innerHTML = `<i class="fas ${iconClass}"></i>`;
}

/* Update Background */
function updateBackground(condition) {
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

/* Initialize App */
document.addEventListener('DOMContentLoaded', init);
