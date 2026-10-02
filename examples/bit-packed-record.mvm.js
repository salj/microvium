/* microvium: default-float=f64 */

function encodeRecord(flags, temperatureDelta, sample) {
  const packet = Microvium.newUint8Array(4);
  MicroviumBytes.writeInteger(packet, 0, 3, /*(u3)*/ flags, true);
  MicroviumBytes.writeInteger(packet, 3, 10, /*(i10)*/ temperatureDelta, true);
  MicroviumBytes.writeInteger(packet, 13, 11, /*(u11)*/ sample, true);
  return packet;
}

function decodeRecord(packet) {
  return {
    flags: MicroviumBytes.readInteger(packet, 0, 3, false, true),
    temperatureDelta: MicroviumBytes.readInteger(packet, 3, 10, true, true),
    sample: MicroviumBytes.readInteger(packet, 13, 11, false, true),
  };
}

vmExport(1, () => decodeRecord(encodeRecord(5, -17, 1400)).flags);
vmExport(2, () => decodeRecord(encodeRecord(5, -17, 1400)).temperatureDelta);
vmExport(3, () => decodeRecord(encodeRecord(5, -17, 1400)).sample);
