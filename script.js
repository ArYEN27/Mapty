'use strict';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class Workout{
    date = new Date();
    id = (Date.now() + '').slice(-10);

        constructor(coords, distance, duration) {
        // this.date= ...
        // this.id= ...
        this.coords = coords;
        this.distance = distance; //in km
        this.duration = duration; //in min  
    }
}

class Running extends Workout{
    type= "running"
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        // console.log(this.calcPace());
    }

    calcPace() {
        this.pace =   this.distance / this.duration;
        return this.pace
    }
}

class Cycling extends Workout{
    type= "cycling"
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        console.log(this.calcSpeed());
    }
    
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60 );
    }
}

const run1= new Running([39, -12], 5, 25, 178)
const cyc1 = new Cycling([39, -12], 27, 95, 523)

// console.log(run1);
// console.log(cyc1);

// Application Object
class App{
    #map;
    #mapEvent;
    #workouts = [];

    constructor() {
        this._getPosition();
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField );
    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
                function () {
                    alert('Could not get your position')
                });
     }
    
    _loadMap(position) {

        const { latitude } = position.coords;
        const { longitude } = position.coords;
        // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        const coords = [latitude, longitude];
        this.#map = L.map('map').setView(coords, 13);

        L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // Handling clicks on the map
        this.#map.on('click', this._showForm.bind(this));
    }
    
    _showForm(mapE) {
        this.#mapEvent = mapE;
        // console.log(mapE);
            form.classList.remove('hidden');
            inputDistance.focus();
     }
    
    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
     }
    
    _newWorkout(e) {
        e.preventDefault();

        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive= (...inputs)=> inputs.every(inp => inp > 0)
        
        //  Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;
        
        // If workout running, create running object
        if (type == 'running') {
            const cadence = + inputCadence.value;
            // Checking validity of data
            // if(!Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence)) return alert('Inputshave to be positive numbers')
            if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)
            ) return alert('Inputs have to be positive numbers!')
            
            // coords, distance, duration, cadence
            workout = new Running([lat, lng], distance, duration, cadence); 
            
        }
        
        // If workout cycling, create cycling object
        if (type == 'cycling') {
            const elevationGain = +inputElevation.value;

            if (!validInputs(distance, duration, elevationGain) || !allPositive(distance, duration, elevationGain)
            ) return alert('Inputs have to be positive numbers!')
            
            // coords, distance, duration, elevationGain
            workout = new Cycling([lat, lng], distance, duration, elevationGain);
            
        }

        // Add new workout to workout array
        this.#workouts.push(workout);
        // console.log(workout);

        // Render workout on map as a marker
        this._renderWorkoutMarker(workout);
        
        this._renderWorkout(workout)
                
        // Clear Input Fields
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    }
    
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
                .addTo(this.#map)
                .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className:`${workout.type}-popup`,
                    }))
                    .setPopupContent('Workout')
                    .openPopup();      
    }
    
    _renderWorkout(workout) {
        const html = `
        <li class="workout workout--running" data-id="1234567890">
          <h2 class="workout__title">Running on April 14</h2>
          <div class="workout__details">
            <span class="workout__icon">🏃‍♂️</span>
            <span class="workout__value">5.2</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">24</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">4.6</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">178</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;        
    }

};

const app = new App();
