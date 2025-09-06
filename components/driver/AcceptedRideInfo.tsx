import { MaterialCommunityIcons, MaterialIcons, Octicons } from "@expo/vector-icons";
import React, { memo, useEffect, useState } from "react";
import { Alert, Linking, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors, styles } from "../../constants/tailwindStyles";
import { Ride } from "../../types/rider";
import { storage } from "../../utils/storage";

interface AcceptedRideInfoProps {
  acceptedRide: Ride | null;
  driverLocation: { latitude: number; longitude: number } | null;
}
const getRelativeTime = (createdAt: string | Date): string => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  
  if (isNaN(diffMs) || diffMs < 0) return "Just started";
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 30) return "Just started";
  if (diffSeconds < 60) return `Started ${diffSeconds}s ago`;
  if (diffMinutes === 1) return "Started 1 min ago";
  if (diffMinutes < 60) return `Started ${diffMinutes} min ago`;
  if (diffHours === 1) return "Started 1 hr ago";
  return `Started ${diffHours} hr ago`;
};

// Get ambulance type details
const getAmbulanceTypeDetails = (type: string) => {
  const types = {
    'bls': { name: 'Basic Life Support', icon: 'medical-bag', color: colors.medical[600] },
    'als': { name: 'Advanced Life Support', icon: 'heart-pulse', color: colors.emergency[600] },
    'ccs': { name: 'Critical Care Support', icon: 'hospital', color: colors.primary[600] },
    'neonatal': { name: 'Neonatal Transport', icon: 'baby-carriage', color: colors.warning[600] }
  };
  return types[type as keyof typeof types] || types.bls;
};

// Get status information
const getStatusInfo = (status: string) => {
  const statusMap = {
    'START': { label: 'En Route to Patient', color: colors.warning[600], icon: 'car' },
    'ARRIVED': { label: 'Arrived at Location', color: colors.primary[600], icon: 'map-marker-check' },
    'COMPLETED': { label: 'Trip Completed', color: colors.medical[600], icon: 'check-circle' },
    'SEARCHING': { label: 'Request Accepted', color: colors.emergency[600], icon: 'ambulance' }
  };
  return statusMap[status as keyof typeof statusMap] || statusMap.SEARCHING;
};

// Generate storage key for OTP verification state
const generateOtpStorageKey = (rideId: string): string => {
  return `otp_verified_${rideId}`;
};

function AcceptedRideInfo({
  acceptedRide,
}: AcceptedRideInfoProps) {
  const [relativeTime, setRelativeTime] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [, setOtpStorageKey] = useState("");

  // Early return if no accepted ride
  if (!acceptedRide) {
    return (
      <View style={[styles.alignCenter, { paddingVertical: 32 }]}>
        <Text style={[styles.textBase, styles.textGray600]}>
          No accepted ride available
        </Text>
      </View>
    );
  }

  // Load OTP verification state from storage
  const loadOtpVerificationState = async (rideId: string) => {
    try {
      const storageKey = generateOtpStorageKey(rideId);
      const storedState = await storage.getItem(storageKey);
      if (storedState === "true") {
        setIsOtpVerified(true);
      }
      setOtpStorageKey(storageKey);
    } catch (error) {
      console.error("Failed to load OTP verification state:", error);
      setIsOtpVerified(false);
      setOtpStorageKey(generateOtpStorageKey(rideId));
    }
  };

  const saveOtpVerificationState = async (rideId: string, isVerified: boolean) => {
    try {
      const storageKey = generateOtpStorageKey(rideId);
      if (isVerified) {
        await storage.setItem(storageKey, "true");
      } else {
        await storage.removeItem(storageKey);
      }
    } catch (error) {
      console.error("Failed to save OTP verification state:", error);}
  };

  useEffect(() => {
    if (!acceptedRide) return;
    
    loadOtpVerificationState(acceptedRide._id);
    
    const updateTime = () => setRelativeTime(getRelativeTime(acceptedRide.createdAt));
    updateTime();
    
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [acceptedRide?._id, acceptedRide?.createdAt]);

  useEffect(() => {
    if (!acceptedRide) {
      setOtpInput("");
      setIsOtpVerified(false);
      setOtpStorageKey("");
    }
  }, [acceptedRide?._id]);

  const formatFare = (fare: number): number => {
    return Math.round(fare / 5) * 5;
  };

  const handleOtpVerification = async () => {
    if (!acceptedRide) return;
    
    if (otpInput.trim() === acceptedRide?.otp) {
      setIsOtpVerified(true);
      await saveOtpVerificationState(acceptedRide._id, true);
      Alert.alert("Success", "OTP verified successfully!");
      setOtpInput("");
    } else {
      Alert.alert("Error", "Invalid OTP. Please try again.");
    }
  };

  const handlePhoneCall = () => {
    let phone = '';
    if (typeof acceptedRide?.customer === 'object' && acceptedRide.customer?.phone) {
      phone = acceptedRide.customer.phone;
    } else if (typeof acceptedRide?.customer === 'string') {
      phone = acceptedRide.customer;
    }
    if (!phone) return;

    const phoneUrl = `tel:${phone}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert("Error", "Phone calls are not supported on this device");
        }
      })
      .catch((err) => console.error('Error opening phone:', err));
  };

  const handleDirections = () => {
    if (!acceptedRide) return;
    
    const { latitude, longitude } = acceptedRide.pickup;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert("Error", "Maps navigation is not supported on this device");
        }
      })
      .catch((err) => console.error('Error opening maps:', err));
  };

  if (!acceptedRide) {
    return (
      <View style={[styles.py6, styles.alignCenter]}>
        <Text style={[styles.textLg, styles.textGray500]}>No active ride</Text>
      </View>
    );
  }

  const ambulanceDetails = getAmbulanceTypeDetails(acceptedRide.vehicle);
  const statusInfo = getStatusInfo(acceptedRide.status);

  return (
    <ScrollView style={[styles.flex1]} showsVerticalScrollIndicator={false} bounces={false}>
      {/* Clean Header */}
      <View style={[styles.mb4, styles.p4, styles.roundedLg, { backgroundColor: colors.gray[50] }]}> 
        <View style={[styles.flexRow, styles.alignCenter, styles.justifyBetween, styles.mb3]}>
          <View style={[styles.flexRow, styles.alignCenter]}>
            <View style={[styles.w10, styles.h10, styles.roundedFull, styles.alignCenter, styles.justifyCenter, { backgroundColor: colors.emergency[100] }]}>
              <MaterialCommunityIcons name={statusInfo.icon as any} size={20} color={statusInfo.color} />
            </View>
            <Text style={[styles.textLg, styles.fontSemibold, styles.textGray900, styles.ml3]}>
              {ambulanceDetails.name}
            </Text>
          </View>
          <View style={[styles.px3, styles.py1, styles.roundedFull, { backgroundColor: statusInfo.color + '15' }]}>
            <Text style={[styles.textXs, styles.fontMedium, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <Text style={[styles.textSm, styles.textGray600, styles.mb2]}>
          Request ID: #{acceptedRide._id.slice(-6).toUpperCase()}
        </Text>

        {/* Emergency and Hospital Info */}
        {acceptedRide.emergency?.name && (
          <View style={[styles.flexRow, styles.alignCenter, styles.mb1]}>
            <MaterialCommunityIcons name="alert" size={14} color={colors.emergency[600]} style={[styles.mr2]} />
            <Text style={[styles.textSm, styles.fontMedium, styles.textGray800]}>
              {acceptedRide.emergency.name}
            </Text>
          </View>
        )}

        {acceptedRide.hospitalDetails?.name && (
          <View style={[styles.flexRow, styles.alignCenter, styles.mb3]}>
            <MaterialCommunityIcons name="hospital-building" size={14} color={colors.medical[600]} style={[styles.mr2]} />
            <Text style={[styles.textSm, styles.fontMedium, styles.textGray800]}>
              {acceptedRide.hospitalDetails.name}
            </Text>
          </View>
        )}

        {/* Time and Fare Info */}
        <View style={[styles.flexRow, styles.justifyBetween]}>
          <View style={[styles.flexRow, styles.alignCenter]}>
            <Octicons name="clock" size={12} color={colors.gray[500]} style={[styles.mr1]} />
            <Text style={[styles.textXs, styles.textGray600]}>
              {relativeTime}
            </Text>
          </View>
          
          <View style={[styles.flexRow, styles.alignCenter]}>
            <MaterialIcons name="attach-money" size={12} color={colors.gray[500]} style={[styles.mr1]} />
            <Text style={[styles.textXs, styles.textGray600]}>
              ₹{formatFare(acceptedRide.fare)}
            </Text>
          </View>
        </View>
      </View>

      {/* Location Details */}
      <View style={[styles.mb4]}>
        <Text style={[styles.textBase, styles.fontSemibold, styles.textGray900, styles.mb3]}>
          Trip Details
        </Text>
        
        {/* Pickup Location */}
        <View style={[styles.p3, styles.roundedLg, styles.mb3, { backgroundColor: colors.gray[50] }]}>
          <View style={[styles.flexRow, styles.alignCenter, styles.mb2]}>
            <MaterialCommunityIcons name="map-marker" size={16} color={colors.primary[600]} style={[styles.mr2]} />
            <Text style={[styles.textSm, styles.fontMedium, styles.textGray800]}>
              Pickup Location
            </Text>
          </View>
          <Text style={[styles.textSm, styles.textGray700]} numberOfLines={2}>
            {acceptedRide.pickup.address}
          </Text>
        </View>

        {/* Hospital/Drop Location */}
        <View style={[styles.p3, styles.roundedLg, { backgroundColor: colors.gray[50] }]}>
          <View style={[styles.flexRow, styles.alignCenter, styles.mb2]}>
            <MaterialCommunityIcons name="hospital-building" size={16} color={colors.medical[600]} style={[styles.mr2]} />
            <Text style={[styles.textSm, styles.fontMedium, styles.textGray800]}>
              Destination Hospital
            </Text>
          </View>
          <Text style={[styles.textSm, styles.textGray700]} numberOfLines={2}>
            {acceptedRide.drop.address}
          </Text>
        </View>
      </View>

      {/* OTP Verification Section */}
      <View style={[styles.mb4]}>
        <Text style={[styles.textBase, styles.fontSemibold, styles.textGray900, styles.mb3]}>
          Patient Verification
        </Text>
        
        {isOtpVerified ? (
          <View style={[styles.p4, styles.roundedLg, { backgroundColor: colors.medical[50] }]}>
            <View style={[styles.flexRow, styles.alignCenter, styles.justifyCenter]}>
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.medical[600]} style={[styles.mr2]} />
              <Text style={[styles.textSm, styles.fontMedium, styles.textGray800]}>
                Patient Verified
              </Text>
            </View>
            <Text style={[styles.textCenter, styles.textXs, styles.textGray600, styles.mt1]}>
              OTP verification completed
            </Text>
          </View>
        ) : (
          <View style={[styles.p4, styles.roundedLg, { backgroundColor: colors.gray[50] }]}>
            <View style={[styles.mb3]}>
              <Text style={[styles.textSm, styles.fontMedium, styles.textGray700, styles.mb2]}>
                Verify patient with 4-digit OTP:
              </Text>
              <View style={[styles.flexRow, styles.alignCenter, styles.gap2]}>
                <TextInput style={[styles.flex1, styles.py3, styles.px4, styles.roundedLg, styles.textCenter, styles.textBase, styles.fontMedium, { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200] }]}
                  value={otpInput}
                  onChangeText={setOtpInput}
                  placeholder="Enter OTP"
                  keyboardType="numeric"
                  maxLength={4}
                  textAlign="center"
                />
                <TouchableOpacity style={[styles.py3, styles.px4, styles.roundedLg, { backgroundColor: colors.primary[600] }]}
                  onPress={handleOtpVerification}
                  disabled={otpInput.length !== 4}>
                  <Text style={[styles.textSm, styles.fontMedium, styles.textWhite]}>
                    Verify
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.textXs, styles.textGray600, styles.textCenter]}>
              Patient OTP: {acceptedRide.otp} (for testing)
            </Text>
          </View>
        )}
      </View>

      {/* Quick Action Buttons */}
      <View style={[styles.mb4]}>
        <TouchableOpacity style={[styles.w100, styles.py3, styles.roundedLg, styles.alignCenter,
            { backgroundColor: colors.gray[50] }]}
          onPress={handlePhoneCall} activeOpacity={0.7}>
          <View style={[styles.flexRow, styles.alignCenter]}>
            <MaterialIcons name="phone" size={18} color={colors.gray[700]} style={[styles.mr2]} />
            <Text style={[styles.textSm, styles.fontMedium, styles.textGray700]}>
              Call Patient
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Emergency Contact Info */}
      <View style={[styles.p3, styles.roundedLg, { backgroundColor: colors.gray[50] }]}> 
        <View style={[styles.flexRow, styles.alignCenter, styles.mb1]}>
          <MaterialCommunityIcons name="phone-alert" size={16} color={colors.emergency[600]} style={[styles.mr2]} />
          <Text style={[styles.textSm, styles.fontMedium, styles.textGray800]}>
            Emergency Contact
          </Text>
        </View>
        <Text style={[styles.textBase, styles.textGray800]}>
          {typeof acceptedRide.customer === 'object' && acceptedRide.customer?.phone
            ? acceptedRide.customer.phone
            : typeof acceptedRide.customer === 'string'
              ? acceptedRide.customer
              : 'N/A'}
        </Text>
      </View>
    </ScrollView>
  );
}

export default memo(AcceptedRideInfo);
