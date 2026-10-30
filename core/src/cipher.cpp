#include "wwt/cipher.hpp"

#include <cctype>

namespace wwt {

std::string caesar(std::string_view text, int shift) {
  int s = shift % 26;
  if (s < 0) s += 26;
  std::string out;
  out.reserve(text.size());
  for (unsigned char ch : text) {
    if (ch >= 'A' && ch <= 'Z') {
      out.push_back(static_cast<char>('A' + (ch - 'A' + s) % 26));
    } else if (ch >= 'a' && ch <= 'z') {
      out.push_back(static_cast<char>('a' + (ch - 'a' + s) % 26));
    } else {
      out.push_back(static_cast<char>(ch));
    }
  }
  return out;
}

}

int wwt_caesar(const char* text, int shift, char* out, int out_len) {
  if (!text || !out || out_len <= 0) return 0;
  auto result = wwt::caesar(text, shift);
  const int n = static_cast<int>(result.size());
  const int copy = n < out_len - 1 ? n : out_len - 1;
  for (int i = 0; i < copy; ++i) out[i] = result[static_cast<size_t>(i)];
  out[copy] = '\0';
  return copy;
}
