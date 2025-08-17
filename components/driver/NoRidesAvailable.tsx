import React from "react";
import { Text, View } from "react-native";
import { styles } from "../../constants/tailwindStyles";

export default function NoRidesAvailable() {
  return (
    <View style={[styles.bgGray50, styles.roundedXl, styles.p6, styles.alignCenter, styles.mt4]}>
      <View style={[ styles.w20, styles.h20, styles.bgGray200, styles.roundedFull, 
        styles.justifyCenter, styles.alignCenter, styles.mb4]}>
        <Text style={[styles.text2xl]}>🚑</Text>
      </View>
      <Text style={[styles.fontMedium, styles.textGray900, styles.mb2]}>
        No emergency requests available
      </Text>
      <Text style={[styles.textSm, styles.textGray500, styles.textCenter]}>
        Stay online and we'll notify you when new requests come in
      </Text>
    </View>
  );
}
