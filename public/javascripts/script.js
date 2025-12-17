let activeCoin = null;
let offsetX, offsetY;

//Audio
const dropSound = new Audio('/audio/coin_drop.wav');
const pickupSound = new Audio('/audio/coin_pickup.wav');
dropSound.volume = 0.5;
pickupSound.volume = 0.5;

// Formats time and date display
const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric'
});

//Coin Images
const coinImages = [
    '/images/penny_front.png',
    '/images/penny_back.png',
];

document.addEventListener('DOMContentLoaded', () => {
    //Welcome pop-up
    const intro = document.getElementById('introOverlay'); 
    const closeBtn = document.getElementById('closeIntroBtn');
    const hasSeenIntro = localStorage.getItem('hasSeenCoinIntro');

    if (!hasSeenIntro) {
        intro.style.display = 'flex';
    }

    closeBtn.onclick = () => {
        intro.style.display = 'none';
        localStorage.setItem('hasSeenCoinIntro', 'true');
    };

    document.getElementById('leavePenny').addEventListener('click', handleLeavePennyClick);
    fetchAndDisplayPennies();
    displayActivityLog();
});

//Load random penny image
function getRandomCoinImage() {
    return coinImages[Math.floor(Math.random() * coinImages.length)];
}

//Display pennies
async function fetchAndDisplayPennies() {
    const coinArea = document.getElementById('coinArea');
    try {
        const response = await fetch('/users/all');
        const fullCollection = await response.json(); 
        coinArea.innerHTML = ''; 
        
        fullCollection
            .filter(penny => penny.status === 'circulating')
            .forEach(penny => createCoinElement(penny, coinArea));
    } catch (error) {
        console.error('Error loading coins:', error);
    }
}

//Create new penny
function createCoinElement(coinData, container) {
    const coinDiv = document.createElement('div');
    coinDiv.classList.add('coin-specimen');

    coinDiv.style.backgroundImage = `url('${getRandomCoinImage()}')`; 
    
    const randomX = Math.random() * 85; 
    const randomY = Math.random() * 80;
    const randomRotation = Math.floor(Math.random() * 360);

    coinDiv.style.left = `${randomX}%`;
    coinDiv.style.top = `${randomY}%`;
    coinDiv.style.transform = `rotate(${randomRotation}deg)`;

    makeDraggable(coinDiv);

    coinDiv.onclick = async (event) => {
        if (coinDiv.moved) {
            coinDiv.moved = false; 
            return; 
        }
    //PUT take coin and update status
        const wantsToTake = await showModal(coinData);
        if (wantsToTake) {
            const res = await fetch(`/users/${coinData._id}`, { method: 'PUT' });
            if (res.ok) {
                pickupSound.currentTime = 0;
                pickupSound.play();
                coinDiv.remove(); 
                document.getElementById('feedbackMessage').textContent = "You picked up the penny!";
                displayActivityLog(); 
            }
        }
    };

    container.appendChild(coinDiv);
}

//Drag functionality
function makeDraggable(coin) {
    coin.onmousedown = (e) => {
        activeCoin = coin; 
        coin.moved = false; 
        offsetX = e.clientX - coin.getBoundingClientRect().left;
        offsetY = e.clientY - coin.getBoundingClientRect().top;
        coin.style.zIndex = 1000;
        e.preventDefault(); 
    };

// Mobile support
    coin.ontouchstart = (e) => {
        const touch = e.touches[0];
        coin.onmousedown({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
    };
}

document.addEventListener('mousemove', (e) => {
    if (!activeCoin) return;

    activeCoin.moved = true; 
    const container = document.getElementById('coinArea');
    const rect = container.getBoundingClientRect();

    let x = e.clientX - rect.left - offsetX;
    let y = e.clientY - rect.top - offsetY;

    x = Math.max(0, Math.min(x, rect.width - activeCoin.offsetWidth));
    y = Math.max(0, Math.min(y, rect.height - activeCoin.offsetHeight));

    activeCoin.style.left = `${(x / rect.width) * 100}%`;
    activeCoin.style.top = `${(y / rect.height) * 100}%`;
});

document.addEventListener('mouseup', () => {
    if (activeCoin) {
        activeCoin.style.zIndex = '';
        activeCoin = null; 
    }
});

// Touch support for mobile
document.addEventListener('touchmove', (e) => {
    if (!activeCoin) return;
    const touch = e.touches[0];
    document.dispatchEvent(new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    }));
}, { passive: false });

document.addEventListener('touchend', () => {
    document.dispatchEvent(new Event('mouseup'));
});

//POST leave new penny and play sound effect
async function handleLeavePennyClick() {
    const nameInput = document.getElementById('nameInput');
    const name = nameInput.value.trim();
    if (!name) return;

    try {
        const response = await fetch('/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        });
        if (response.ok) {
        dropSound.currentTime = 0; 
        dropSound.play();

        const newCoinData = await response.json();
        createCoinElement(newCoinData, document.getElementById('coinArea'));
        document.getElementById('feedbackMessage').textContent = "Penny left successfully!";
        nameInput.value = '';
        displayActivityLog();
        }
    } catch (error) {
        console.error("Error leaving penny:", error);
    }
};

//Log display
async function displayActivityLog(filterType = 'all') {
    const logList = document.getElementById('activityFeed');
    try {
        const response = await fetch('/users/logs');
        const activities = await response.json();

        logList.innerHTML = activities
            .filter(coin => filterType === 'all' || coin.status === filterType)
            .map(coin => {
                const dateObj = new Date(coin.updatedAt);
                const time = timeFormatter.format(dateObj).toLowerCase();
                const date = dateFormatter.format(dateObj);
                
                // Different returns based on status
                if (coin.status === 'circulating') {
                    return `<li><strong>${coin.name}</strong> left a penny on ${date} at ${time}</li>`;
                } else {
                    return `<li>A penny from <strong>${coin.name}</strong> was taken on ${date} at ${time}</li>`;
                }
            }).join('');
            
    } catch (err) {
        console.error("Log error:", err);
        logList.innerHTML = "<li>Error loading activity history.</li>";
    }
}

// Pop up window
function showModal(coinData) {
    const overlay = document.getElementById('modalOverlay');
    const actionBtn = document.getElementById('modalActionBtn');
    const closeBtn = document.getElementById('closeModal');
    const modalBody = document.getElementById('modalBody');

    const time = timeFormatter.format(new Date(coinData.createdAt)).toLowerCase();
    const date = dateFormatter.format(new Date(coinData.createdAt));

    overlay.style.display = 'flex';
    document.getElementById('modalTitle').textContent = `Penny from ${coinData.name}`;
    modalBody.innerHTML = `<p>Left on ${date} at ${time}</p>`;

    return new Promise((resolve) => {
        actionBtn.onclick = () => { overlay.style.display = 'none'; resolve(true); };
        closeBtn.onclick = () => { overlay.style.display = 'none'; resolve(false); };
        overlay.onclick = (e) => { if (e.target === overlay) { overlay.style.display = 'none'; resolve(false); } };
    });
}
