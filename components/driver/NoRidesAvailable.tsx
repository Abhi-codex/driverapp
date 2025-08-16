import React from "react";
import { Text, View } from "react-native";
import { styles } from "../../constants/tailwindStyles";
import { FontAwesome } from "@expo/vector-icons";

export default function NoRidesAvailable() {
  return (
    <View style={[styles.p2, styles.alignCenter, styles.mt4]}>
      <View style={[ styles.justifyCenter, styles.alignCenter]}>
        <Text style={[styles.text2xl]}>
          <FontAwesome name="ambulance" size={50} color="#4B5563" />
        </Text>
      </View>
      <Text style={[styles.text2xl, styles.textCenter, styles.textGray900]}>
        No emergency requests available
      </Text>
      <Text style={[styles.textXs, styles.textGray500, styles.textCenter]}>
        Stay online and we'll notify you when new requests come in
      </Text>
    </View>
  );
}
