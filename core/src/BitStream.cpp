#include "BitStream.h"
#include <stdexcept>

BitWriter::BitWriter() : current_byte(0), bit_count(0) {}

void BitWriter::writeBit(bool bit) {
    if (bit) {
        current_byte |= (1 << (7 - bit_count));
    }
    bit_count++;
    if (bit_count == 8) {
        buffer.push_back(current_byte);
        current_byte = 0;
        bit_count = 0;
    }
}

void BitWriter::writeBits(uint32_t bits, int num_bits) {
    for (int i = num_bits - 1; i >= 0; --i) {
        writeBit((bits >> i) & 1);
    }
}

void BitWriter::writeByte(uint8_t byte) {
    writeBits(byte, 8);
}

void BitWriter::flush() {
    if (bit_count > 0) {
        buffer.push_back(current_byte);
        current_byte = 0;
        bit_count = 0;
    }
}

const std::vector<uint8_t>& BitWriter::getBuffer() const {
    return buffer;
}

void BitWriter::clear() {
    buffer.clear();
    current_byte = 0;
    bit_count = 0;
}

BitReader::BitReader(const std::vector<uint8_t>& data) 
    : buffer(data), byte_index(0), bit_index(0) {}

bool BitReader::readBit(bool& out_bit) {
    if (isEOF()) return false;
    
    out_bit = (buffer[byte_index] >> (7 - bit_index)) & 1;
    bit_index++;
    if (bit_index == 8) {
        bit_index = 0;
        byte_index++;
    }
    return true;
}

bool BitReader::readBits(int num_bits, uint32_t& out_bits) {
    out_bits = 0;
    bool bit;
    for (int i = 0; i < num_bits; ++i) {
        if (!readBit(bit)) return false;
        out_bits = (out_bits << 1) | bit;
    }
    return true;
}

bool BitReader::readByte(uint8_t& out_byte) {
    uint32_t temp;
    if (readBits(8, temp)) {
        out_byte = static_cast<uint8_t>(temp);
        return true;
    }
    return false;
}

bool BitReader::isEOF() const {
    return byte_index >= buffer.size();
}
