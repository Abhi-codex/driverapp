# Pickup Verification & Ride Completion Endpoints

## Overview
This document describes the endpoints used for pickup verification and ride completion (dropoff) in the InstaAid ambulance booking system. These endpoints are crucial for the ride workflow and ensure proper verification and completion processes.

---

## 🔍 Pickup Verification Endpoint

### **POST** `/ride/verify-pickup`

Verifies that the driver has arrived at the pickup location and confirms pickup with OTP validation.

#### **Authentication Required**
- `Bearer Token` in Authorization header
- **Role Required**: `driver`

#### **Request Body**
```json
{
  "rideId": "string (ObjectId)",
  "otp": "string (4-6 digits)",
  "driverLocation": {
    "latitude": "number",
    "longitude": "number"
  }
}
```

#### **Request Example**
```json
{
  "rideId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "otp": "1234",
  "driverLocation": {
    "latitude": 28.6129,
    "longitude": 77.2295
  }
}
```

#### **Response - Success (200)**
```json
{
  "success": true,
  "message": "Pickup verified successfully",
  "ride": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "status": "ARRIVED",
    "customer": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "name": "John Doe",
      "phone": "+91XXXXXXXXXX"
    },
    "rider": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
      "name": "Driver Name",
      "phone": "+91XXXXXXXXXX"
    },
    "pickup": {
      "address": "123 Main St, City",
      "latitude": 28.6129,
      "longitude": 77.2295
    },
    "drop": {
      "address": "456 Hospital St, City",
      "latitude": 28.6139,
      "longitude": 77.2305
    },
    "emergency": {
      "type": "cardiac",
      "priority": "high"
    },
    "liveTracking": {
      "driverLocation": {
        "latitude": 28.6129,
        "longitude": 77.2295
      },
      "lastUpdated": "2025-09-19T10:30:00.000Z"
    },
    "destinationHospital": {
      "hospitalId": "60f7b3b3b3b3b3b3b3b3b3b6",
      "hospitalName": "City General Hospital"
    }
  }
}
```

#### **Error Responses**

**400 - Bad Request**
```json
{
  "success": false,
  "error": "Invalid OTP",
  "message": "The provided OTP is incorrect"
}
```

**400 - Location Verification Failed**
```json
{
  "success": false,
  "error": "Location verification failed",
  "message": "Driver is not at the pickup location",
  "details": {
    "distanceToPickup": 150,
    "requiredDistance": 100
  }
}
```

**400 - OTP Expired**
```json
{
  "success": false,
  "error": "OTP expired",
  "message": "The OTP has expired. Please contact the patient for a new OTP."
}
```

**429 - Rate Limited**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many OTP verification attempts. Please try again later."
}
```

#### **Business Logic**

1. **Authentication**: Only drivers can verify pickup
2. **Ride Status**: Ride must be in `START` status
3. **Driver Assignment**: Driver must be assigned to the specific ride
4. **OTP Validation**: 
   - OTP must match the ride's OTP
   - OTP expires after 10 minutes
   - Rate limited to 5 attempts per 10 minutes
5. **Location Validation**: Driver must be within 100 meters of pickup location
6. **Status Update**: Ride status changes from `START` to `ARRIVED`

#### **Real-time Events**
- Emits `rideUpdate` to ride room
- Emits `pickupVerified` to patient

---

## 🏁 Ride Completion (Dropoff) Endpoint

### **PATCH** `/ride/update/:rideId`

Updates the ride status to mark completion (dropoff) or other status changes.

#### **Authentication Required**
- `Bearer Token` in Authorization header
- **Role Required**: Any authenticated user (patient/driver)

#### **Request Body**
```json
{
  "status": "COMPLETED"
}
```

#### **Request Example**
```bash
PATCH /ride/update/60f7b3b3b3b3b3b3b3b3b3b3
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "COMPLETED"
}
```

#### **Response - Success (200)**
```json
{
  "message": "Emergency call status updated to COMPLETED",
  "ride": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "status": "COMPLETED",
    "customer": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "name": "John Doe",
      "phone": "+91XXXXXXXXXX"
    },
    "rider": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
      "name": "Driver Name",
      "phone": "+91XXXXXXXXXX"
    },
    "pickup": { /* pickup details */ },
    "drop": { /* drop details */ },
    "fare": 250,
    "vehicle": "bls",
    "createdAt": "2025-09-19T10:00:00.000Z",
    "updatedAt": "2025-09-19T10:45:00.000Z"
  }
}
```

#### **Valid Status Values**
- `START` - Driver started the ride
- `ARRIVED` - Driver arrived at pickup (usually set by verify-pickup)
- `COMPLETED` - Ride completed successfully
- `CANCELLED` - Ride cancelled

#### **Error Responses**

**400 - Bad Request**
```json
{
  "message": "Invalid emergency call status"
}
```

**404 - Not Found**
```json
{
  "message": "Emergency call not found"
}
```

#### **Real-time Events**
- Emits `rideUpdate` to ride room with updated ride data

---

## 🔄 Ride Status Flow

```
SEARCHING_FOR_RIDER → START → ARRIVED → COMPLETED
                        ↓         ↓         
                    CANCELLED  CANCELLED
```

1. **SEARCHING_FOR_RIDER**: Initial status when ride is created
2. **START**: Driver accepts and starts the ride
3. **ARRIVED**: Driver verifies pickup (via `/verify-pickup` endpoint)
4. **COMPLETED**: Ride completed at destination
5. **CANCELLED**: Ride cancelled at any stage

---

## 🔐 Security Features

### Pickup Verification Security
- **OTP Expiry**: 10-minute validity
- **Rate Limiting**: Maximum 5 OTP attempts per 10 minutes
- **Location Verification**: Must be within 100 meters
- **Role-based Access**: Only assigned drivers can verify
- **Audit Logging**: All verification attempts logged

### Status Update Security
- **Authentication Required**: Valid JWT token
- **Authorization Check**: User must be related to the ride
- **Status Validation**: Only valid status transitions allowed

---

## 📱 Real-time Integration

### Socket Events

#### Pickup Verification Events
```javascript
// Emitted to ride room
socket.emit('rideUpdate', {
  rideId: 'string',
  status: 'ARRIVED',
  message: 'Pickup verified successfully',
  driverLocation: { latitude: number, longitude: number }
});

// Emitted to patient
socket.emit('pickupVerified', {
  rideId: 'string',
  driverName: 'string',
  message: 'Your driver has arrived and pickup has been verified'
});
```

#### Status Update Events
```javascript
// Emitted to ride room
socket.emit('rideUpdate', {
  /* full ride object */
});
```

---

## 🧪 Testing Examples

### Test Pickup Verification
```bash
curl -X POST http://localhost:5000/api/ride/verify-pickup \
  -H "Authorization: Bearer <driver_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rideId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "otp": "1234",
    "driverLocation": {
      "latitude": 28.6129,
      "longitude": 77.2295
    }
  }'
```

### Test Ride Completion
```bash
curl -X PATCH http://localhost:5000/api/ride/update/60f7b3b3b3b3b3b3b3b3b3b3 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'
```

---

## ⚠️ Important Notes

1. **OTP Security**: OTPs are generated when ride status changes to `START`
2. **Location Accuracy**: GPS accuracy affects pickup verification
3. **Rate Limiting**: Prevents brute force OTP attacks
4. **Status Transitions**: Not all status changes are bidirectional
5. **Real-time Updates**: All status changes broadcast to connected clients
6. **Audit Trail**: All verification attempts logged for security

---

## 🔧 Configuration

### Environment Variables
- `ACCESS_TOKEN_SECRET`: JWT signing secret
- Rate limiting settings (default: 5 attempts per 10 minutes)
- Location verification radius (default: 100 meters)
- OTP expiry time (default: 10 minutes)

### Error Handling
- All endpoints include comprehensive error handling
- Rate limiting with appropriate HTTP status codes
- Detailed error messages for debugging
- Production-safe error responses