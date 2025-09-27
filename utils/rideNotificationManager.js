const DEFAULT_KEY = 'notified_rides';

class RideNotificationManager {
  constructor(notificationService, storage, options = {}) {
    this.notificationService = notificationService;
    this.storage = storage; // expects getItem/setItem
    this.storageKey = options.storageKey || DEFAULT_KEY;
    this.notified = new Set();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    try {
      const raw = await this.storage.getItem(this.storageKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          arr.forEach(id => this.notified.add(id));
        }
      }
    } catch (err) {
      // ignore - start empty
      console.warn('RideNotificationManager: failed to load persisted notified ids', err);
    }
    this.initialized = true;
  }

  async persist() {
    try {
      await this.storage.setItem(this.storageKey, JSON.stringify(Array.from(this.notified)));
    } catch (err) {
      console.warn('RideNotificationManager: failed to persist notified ids', err);
    }
  }

  // Accepts array of ride objects and optional currentDriverLocation {latitude, longitude}
  async handleAvailableRides(rides = [], currentDriverLocation = null) {
    if (!this.notificationService || typeof this.notificationService.sendRideNotification !== 'function') return;

    const newlyNotified = [];
    for (const ride of rides) {
      const id = ride && ride._id;
      if (!id) continue;
      if (this.notified.has(id)) continue;

      try {
        const payload = {
          rideId: id,
          patientLocation: { latitude: (ride.pickup && ride.pickup.latitude) || 0, longitude: (ride.pickup && ride.pickup.longitude) || 0, address: (ride.pickup && ride.pickup.address) || '' },
          hospitalLocation: { latitude: (ride.drop && ride.drop.latitude) || 0, longitude: (ride.drop && ride.drop.longitude) || 0, address: (ride.drop && ride.drop.address) || '' },
          distance: 0,
          urgency: (ride.urgency || 'medium'),
          estimatedTime: ride.estimatedTime,
          vehicle: ride.vehicle,
        };

        if (currentDriverLocation && typeof this.notificationService.calculateDistance === 'function') {
          try {
            payload.distance = +(this.notificationService.calculateDistance(
              currentDriverLocation.latitude,
              currentDriverLocation.longitude,
              payload.patientLocation.latitude,
              payload.patientLocation.longitude
            ) / 1000).toFixed(1);
          } catch (e) {
            payload.distance = 0;
          }
        }

        await this.notificationService.sendRideNotification(payload);
        this.notified.add(id);
        newlyNotified.push(id);
      } catch (err) {
        console.error('RideNotificationManager: failed to send notification for', id, err);
      }
    }

    if (newlyNotified.length > 0) {
      await this.persist();
    }
  }

  // Handle socket-provided notification objects like { type, ride }
  async handleSocketNotification(data = {}, currentDriverLocation = null) {
    if (!data) return;
    // If backend sends new ride via socket, data.ride or data.type === 'new_ride'
    const ride = data.ride || (data.data && data.data.ride) || null;
    const type = data.type || '';

    if (!ride && type !== 'new_ride') return;

    const id = ride ? ride._id : (data.rideId || data.data?.rideId || null);
    if (!id) return;
    if (this.notified.has(id)) return;

    try {
      const payload = {
        rideId: id,
        patientLocation: { latitude: (ride && ride.pickup && ride.pickup.latitude) || 0, longitude: (ride && ride.pickup && ride.pickup.longitude) || 0, address: (ride && ride.pickup && ride.pickup.address) || '' },
        hospitalLocation: { latitude: (ride && ride.drop && ride.drop.latitude) || 0, longitude: (ride && ride.drop && ride.drop.longitude) || 0, address: (ride && ride.drop && ride.drop.address) || '' },
        distance: 0,
        urgency: (ride && ride.urgency) || 'medium',
        estimatedTime: ride && ride.estimatedTime,
        vehicle: ride && ride.vehicle,
      };

      if (currentDriverLocation && typeof this.notificationService.calculateDistance === 'function') {
        try {
          payload.distance = +(this.notificationService.calculateDistance(
            currentDriverLocation.latitude,
            currentDriverLocation.longitude,
            payload.patientLocation.latitude,
            payload.patientLocation.longitude
          ) / 1000).toFixed(1);
        } catch (e) {
          payload.distance = 0;
        }
      }

      await this.notificationService.sendRideNotification(payload);
      this.notified.add(id);
      await this.persist();
    } catch (err) {
      console.error('RideNotificationManager: failed to handle socket notification for', id, err);
    }
  }
}

module.exports = RideNotificationManager;
