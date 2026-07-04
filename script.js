document.addEventListener('DOMContentLoaded', () => {
  
    const weatherForm = document.getElementById('weather-form');
    const cityInput = document.getElementById('city-input');
    const unitsSelect = document.getElementById('units-select');
    const currentWeatherDisplay = document.getElementById('current-weather-display');
    const forecastDisplay = document.getElementById('forecast-display');

   
    const API_KEY = "9670d15a95a58fb8c9af2552ad56d3bb"; 
    const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
    const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
    const IPINFO_URL = "https://ipinfo.io/json";

  
    const fetchWeather = async (city, units) => {
        const unitSymbol = units === 'metric' ? '°C' : '°F';
        const speedSymbol = units === 'metric' ? 'm/s' : 'mph';

 
        currentWeatherDisplay.innerHTML = '<p class="message">Fetching weather...</p>';
        forecastDisplay.innerHTML = '';

        try {
         
            const currentUrl = `${CURRENT_URL}?q=${city}&appid=${API_KEY}&units=${units}`;
            const forecastUrl = `${FORECAST_URL}?q=${city}&appid=${API_KEY}&units=${units}`;

            const [currentResponse, forecastResponse] = await Promise.all([
                fetch(currentUrl),
                fetch(forecastUrl)
            ]);

            if (!currentResponse.ok) {
                throw new Error('City not found. Please try again.');
            }

            const currentData = await currentResponse.json();
            const forecastData = await forecastResponse.json();

            displayCurrentWeather(currentData, unitSymbol, speedSymbol);
            displayForecast(forecastData, unitSymbol, speedSymbol);

        } catch (error) {
            currentWeatherDisplay.innerHTML = `<p class="error">${error.message}</p>`;
            forecastDisplay.innerHTML = '';
        }
    };


    const displayCurrentWeather = (data, unitSymbol, speedSymbol) => {
        const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        currentWeatherDisplay.innerHTML = `
            <h2>Current Weather in ${data.name}</h2>
            <div class="weather-main-info">
                <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather icon">
                <div>
                    <div class="temp">${Math.round(data.main.temp)}${unitSymbol}</div>
                    <div class="condition">${data.weather[0].description}</div>
                </div>
            </div>
            <div class="weather-details">
                <p><strong>Feels Like:</strong> ${Math.round(data.main.feels_like)}${unitSymbol}</p>
                <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
                <p><strong>Wind:</strong> ${data.wind.speed} ${speedSymbol}</p>
                <p><strong>Pressure:</strong> ${data.main.pressure} hPa</p>
                <p><strong>Sunrise:</strong> ${sunrise}</p>
                <p><strong>Sunset:</strong> ${sunset}</p>
            </div>
        `;
    };

    const displayForecast = (data, unitSymbol, speedSymbol) => {
        let forecastHTML = '<h2>5-Day Forecast</h2><div class="forecast-grid">';

        const forecastsByDate = {};
        data.list.forEach(item => {
            const date = item.dt_txt.split(" ")[0]; // YYYY-MM-DD
            if (!forecastsByDate[date]) forecastsByDate[date] = [];
            forecastsByDate[date].push(item);
        });

        const dates = Object.keys(forecastsByDate).slice(0, 5);

        dates.forEach(date => {
            const day = forecastsByDate[date][0]; // first slot of the day
            const dayLabel = new Date(day.dt * 1000).toLocaleDateString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            forecastHTML += `
                <div class="forecast-day" data-date="${date}">
                    <h3>${dayLabel}</h3>
                    <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="Weather icon">
                    <p><strong>${Math.round(day.main.temp)}${unitSymbol}</strong></p>
                    <p>${day.weather[0].description}</p>
                </div>
            `;
        });

        forecastHTML += '</div>';
        forecastDisplay.innerHTML = forecastHTML;

        // Click handlers to show daily details
        document.querySelectorAll('.forecast-day').forEach(card => {
            card.addEventListener('click', () => {
                const selectedDate = card.getAttribute('data-date');
                showDailyDetails(selectedDate, forecastsByDate[selectedDate], unitSymbol, speedSymbol, data);
            });
        });
    };

    const showDailyDetails = (date, forecasts, unitSymbol, speedSymbol, allData) => {
        let detailsHTML = `<h2>Weather Details for ${new Date(date).toDateString()}</h2>
                           <div class="daily-details-grid">`;

        forecasts.forEach(slot => {
            const time = new Date(slot.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            detailsHTML += `
                <div class="daily-slot">
                    <h4>${time}</h4>
                    <img src="https://openweathermap.org/img/wn/${slot.weather[0].icon}.png" alt="Weather icon">
                    <p><strong>${Math.round(slot.main.temp)}${unitSymbol}</strong></p>
                    <p>${slot.weather[0].description}</p>
                    <p>Humidity: ${slot.main.humidity}%</p>
                    <p>Wind: ${slot.wind.speed} ${speedSymbol}</p>
                </div>
            `;
        });

        detailsHTML += '</div><button id="back-to-forecast">⬅ Back to Forecast</button>';
        forecastDisplay.innerHTML = detailsHTML;

        document.getElementById('back-to-forecast').addEventListener('click', () => {
            displayForecast(allData, unitSymbol, speedSymbol);
        });
    };


    const getWeatherByIP = async () => {
        try {
            const response = await fetch(IPINFO_URL);
            const data = await response.json();
            const city = data.city || "London"; 
            const units = unitsSelect.value;
            fetchWeather(city, units);
        } catch (error) {
            console.error("Could not auto-detect location:", error);
            currentWeatherDisplay.innerHTML = '<p class="message">Could not detect location. Please enter a city.</p>';
        }
    };

    weatherForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const city = cityInput.value.trim();
        const units = unitsSelect.value;

        if (city) {
            fetchWeather(city, units);
        } else {
            getWeatherByIP();
        }
    });

    getWeatherByIP();
});
