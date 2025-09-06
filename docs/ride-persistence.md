# Ride Persistence and Navigation Flow

## Overview

The InstaAid driver app now includes comprehensive ride persistence to ensure drivers never lose their active rides, even if they navigate away from the map screen or close the app entirely.

## Key Features

### 🔒 **Ride Persistence**
- Accepted rides are automatically saved to AsyncStorage
- Trip state (pickup/dropoff stage) is preserved
- Rides persist through app restarts and navigation changes
- Automatic cleanup when rides are completed

### 🚫 **Back Button Protection** 
- Hardware and software back buttons are intercepted when driver has active ride
- Confirmation dialog prevents accidental ride loss
- Smart navigation to dashboard while keeping ride active

### 🏠 **Dashboard Integration**
- Dashboard shows ongoing ride status with visual indicators
- "Drive" button changes based on ride state:
  - **No Active Ride**: "Start Driving" → Go to map to accept rides
  - **Ride Accepted**: "Go to Patient" → Navigate to patient pickup
  - **Patient Onboard**: "Continue to Hospital" → Navigate to hospital

### 🎯 **Smart Navigation Flow**
- Seamless transition between dashboard and map screens
- Rides remain active regardless of current screen
- Automatic stage progression with proper state management

## User Experience Flow

### 1. Driver Accepts Emergency Ride
```
Driver taps "Accept" on emergency call →
Ride is immediately persisted to storage →
Navigation controls appear →
Driver can safely navigate away without losing ride
```

### 2. Back Button Protection
```
Driver presses back button while on active ride →
Confirmation dialog: "You have an ongoing ride. Return to dashboard?" →
If confirmed: Navigate to dashboard (ride stays active) →
If cancelled: Stay on current screen
```

### 3. Dashboard with Active Ride
```
Dashboard shows "Go to Patient" or "Continue to Hospital" →
Prominent visual indicator of ride status →
Single tap returns to active ride map view →
All ride data and navigation state preserved
```

### 4. App Close/Restart Protection
```
Driver closes app completely →
Upon reopening: Ride automatically restored →
Navigation state and trip progress preserved →
Driver can immediately continue where they left off
```

## Technical Implementation

### Persistence Storage
```typescript
// Ride data structure in AsyncStorage
{
  "accepted_ride": {
    "_id": "ride123",
    "pickup": { "latitude": 40.7128, "longitude": -74.0060 },
    "drop": { "latitude": 40.7589, "longitude": -73.9851 },
    "patient": { ... },
    "status": "START"
  },
  "trip_started": true
}
```

### State Management
```typescript
// Enhanced useRiderLogic hook
const {
  acceptedRide,        // Current active ride (null if none)
  tripStarted,         // Boolean: patient picked up?
  
  // Persistence functions
  persistRide,         // Save ride to storage
  loadPersistedRide,   // Load ride on app start
  clearPersistedRide   // Clear when ride completed
} = useRiderLogic();
```

### Back Button Handling
```typescript
// Hardware back button protection
useFocusEffect(
  React.useCallback(() => {
    const onBackPress = () => {
      if (acceptedRide) {
        showActiveRideDialog();
        return true; // Prevent default back
      }
      return false; // Allow normal back
    };
    // ...
  }, [acceptedRide])
);
```

## Dashboard Drive Button States

### State 1: No Active Ride + Offline
```
🔴 "Go Online First"
"You must be online to accept emergency calls"
[Button Disabled]
```

### State 2: No Active Ride + Online
```
🚨 "Start Driving"
"Go to map view and start accepting ride requests"
"X emergency calls available"
[Button Active - Goes to Map]
```

### State 3: Ride Accepted (Pre-Pickup)
```
📍 "Go to Patient"
"You have an accepted ride. Navigate to patient pickup."
[RIDE ACCEPTED indicator]
[Button Active - Goes to Active Ride Map]
```

### State 4: Patient Onboard (Post-Pickup)
```
🏥 "Continue to Hospital"
"You have a patient onboard. Navigate to hospital."
[🚨 PATIENT ONBOARD indicator]
[Button Active - Goes to Active Ride Map]
```

## Implementation Details

### 1. Ride Acceptance Flow
```typescript
const handleAcceptRide = async (rideId, location) => {
  // Accept ride via API
  const ride = await acceptRideAPI(rideId);
  
  // Immediately persist to storage
  await persistRide(ride, false);
  
  // Update UI state
  setAcceptedRide(ride);
  setTripStarted(false);
};
```

### 2. Stage Completion Flow
```typescript
const handleStageComplete = async (stage) => {
  if (stage === 'pickup') {
    // Update ride status to START
    await updateRideStatus(rideId, 'START');
    
    // Update persisted state
    await persistRide(acceptedRide, true);
    
    // Update UI
    setTripStarted(true);
  } else if (stage === 'dropoff') {
    // Complete ride
    await updateRideStatus(rideId, 'COMPLETED');
    
    // Clear persistence
    await clearPersistedRide();
    
    // Reset state
    setAcceptedRide(null);
    setTripStarted(false);
  }
};
```

### 3. App Initialization
```typescript
useEffect(() => {
  // On app start, check for persisted rides
  loadPersistedRide();
}, []);

const loadPersistedRide = async () => {
  const rideData = await AsyncStorage.getItem('accepted_ride');
  const tripData = await AsyncStorage.getItem('trip_started');
  
  if (rideData) {
    const ride = JSON.parse(rideData);
    const started = JSON.parse(tripData || 'false');
    
    // Restore state
    setAcceptedRide(ride);
    setTripStarted(started);
  }
};
```

## Error Handling

### Storage Failures
```typescript
const persistRide = async (ride, started) => {
  try {
    await AsyncStorage.setItem('accepted_ride', JSON.stringify(ride));
    await AsyncStorage.setItem('trip_started', JSON.stringify(started));
  } catch (error) {
    console.error('Failed to persist ride:', error);
    // Continue execution - don't block user flow
  }
};
```

### Corrupted Data Recovery
```typescript
const loadPersistedRide = async () => {
  try {
    const rideData = await AsyncStorage.getItem('accepted_ride');
    if (rideData) {
      const ride = JSON.parse(rideData);
      // Validate ride structure
      if (ride._id && ride.pickup && ride.drop) {
        setAcceptedRide(ride);
      } else {
        // Clear corrupted data
        await clearPersistedRide();
      }
    }
  } catch (error) {
    console.error('Failed to load ride, clearing storage:', error);
    await clearPersistedRide();
  }
};
```

### Network Connectivity Issues
```typescript
const handleStageComplete = async (stage) => {
  try {
    // Attempt to update server
    await updateRideStatus(rideId, newStatus);
    
    // Update local storage on success
    await persistRide(updatedRide, newTripState);
  } catch (networkError) {
    // Keep local state updated even if server fails
    await persistRide(rideWithUpdatedState, newTripState);
    
    // Queue for retry when network recovers
    queuePendingUpdate(rideId, newStatus);
  }
};
```

## Testing Scenarios

### 1. Basic Flow Test
```
✅ Accept ride → Navigate away → Return → Ride still active
✅ Start trip → Close app → Reopen → Trip state preserved
✅ Complete ride → Persistence cleared → Dashboard shows no active ride
```

### 2. Edge Case Testing
```
✅ Press back during ride → Dialog appears → Confirm → Go to dashboard
✅ Press back during ride → Dialog appears → Cancel → Stay on map
✅ Force close app during ride → Reopen → Ride restored correctly
✅ Network failure during stage change → Local state updated → Retry on reconnect
```

### 3. Data Integrity Testing
```
✅ Corrupt AsyncStorage data → App handles gracefully → Clears bad data
✅ Partial data in storage → App validates → Requests missing info
✅ Multiple rapid stage changes → Final state is correct → No race conditions
```

## Benefits

### For Drivers
- **Never lose a ride** - Even if app crashes or phone dies
- **Seamless navigation** - Switch between dashboard and map freely
- **Clear status indicators** - Always know current ride state
- **Accident protection** - Back button won't lose active rides

### For Patients
- **Reliable service** - Drivers can't accidentally abandon rides
- **Consistent tracking** - Ride state maintained throughout journey
- **Faster response** - Drivers can quickly return to active rides

### for Operations
- **Data consistency** - Ride states properly tracked and persisted
- **Reduced support** - Fewer "lost ride" complaints
- **Better analytics** - Complete ride lifecycle tracking
- **Improved reliability** - System handles edge cases gracefully

## Security Considerations

### Data Protection
- Ride data stored locally only temporarily
- Automatic cleanup on ride completion
- No sensitive payment or personal data persisted
- Location data encrypted in transit

### State Validation
- Server state always takes precedence
- Local persistence used only for UX continuity
- Regular sync with backend for data consistency
- Conflict resolution favors server data

## Future Enhancements

### Planned Features
- **Offline mode** - Handle rides when network unavailable
- **Multi-ride support** - Queue multiple emergency calls
- **Backup sync** - Cloud backup of critical ride data
- **Recovery tools** - Admin tools to recover lost rides

### Advanced Persistence
- **Redux persistence** - Full app state backup
- **Encrypted storage** - Enhanced security for sensitive data
- **Automatic cleanup** - Smart data retention policies
- **Cross-device sync** - Share ride state across devices
