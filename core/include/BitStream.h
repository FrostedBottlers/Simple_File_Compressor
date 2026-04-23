#pragma once
#include <vector>
#include <cstdint>
#include <fstream>
#include <string>

class BitWriter {
private:
    std::vector<uint8_t> buffer;
    uint8_t current_byte;
    int bit_count;

public:
    BitWriter();
    void writeBit(bool bit);
    void writeBits(const std::vector<bool>& bits);
    void writeBits(uint32_t bits, int num_bits);
    void writeByte(uint8_t byte);
    void flush();
    const std::vector<uint8_t>& getBuffer() const;
    void clear();
};

class BitReader {
private:
    const std::vector<uint8_t>& buffer;
    size_t byte_index;
    int bit_index;

public:
    BitReader(const std::vector<uint8_t>& data);
    bool readBit(bool& out_bit);
    bool readBits(const std::vector<bool>& bits_to_match); // optional if needed
    bool readBits(int num_bits, uint32_t& out_bits);
    bool readByte(uint8_t& out_byte);
    bool isEOF() const;
};
