'use strict';


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnReset= document.querySelector('.btn-reset'); 


class Workout{
    date = new Date();
    id = (Date.now() + '').slice(-10);
    // type;
    
    constructor(coords, distance, duration) {
        // this.date= ...
        // this.id= ...
        this.coords = coords;
        this.distance = distance; //in km
        this.duration = duration; //in min 
    }
    
    _setDescription() {
        // Prettier Ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
        
        
    }
}

class Running extends Workout{
    type= "running"
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
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
        // console.log(this.calcSpeed());
        this._setDescription();
    }
    
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60 );
    }
}

const run1= new Running([39, -12], 5, 25, 178)
const cyc1 = new Cycling([39, -12], 27, 95, 523)


// Application Object
class App{
    #map;
    #mapEvent;
    #workouts = [];
    #mapZoomLevel = 13;

    constructor() {
        // Get User's Location
        this._getPosition();

        // Get data from Local Storage
        this._getLocalStorage();

        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._pantoPopup.bind(this));

        if (typeof (this.#workouts) != "undefined" && this.#workouts.length > 0) {
            btnReset.classList.toggle('hidden');
        }
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
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // Handling clicks on the map
        this.#map.on('click', this._showForm.bind(this));
        
        
        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        }); 
        
        
    }
    
    _showForm(mapE) {
        this.#mapEvent = mapE;
        // console.log(mapE);
            form.classList.remove('hidden');
            inputDistance.focus();
    }
    
    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid', 1000);
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
        this._hideForm();

        // Setting all workouts to local storage
        this._setLocalStorage();
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
                    .setPopupContent(`${workout.type == 'running' ? '🏃‍♂️' : '🚴‍♀️' } ${workout.description}`)
                    .openPopup();      
    }
    
    _renderWorkout(workout) {
        // distance, duration, cadence

        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type == 'running' ? '🏃‍♂️' : '🚴‍♀️' }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          `;   

        if (workout.type == 'running') {
            html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
          </li>`;
        }
        
        if (workout.type == 'cycling') {
            html += `
         <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>    
          <div class="workout__details">
            <span class="workout__icon">⛰️</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
          </li>`;
        }

        form.insertAdjacentHTML('afterend', html)
    }

    _pantoPopup(e) {
        const workoutEl = e.target.closest('.workout');

        if (!workoutEl) return;

        const workout = this.#workouts.find(work => work.id == workoutEl.dataset.id);
        
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1                
            }
        }); 
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        // console.log(data);

        if (!data) return;

        this.#workouts = data;

        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        });
    }

    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }

};

const app = new App();

btnReset.addEventListener('click', function (e) {
    e.preventDefault();
    app.reset();
});
// console.log(app);