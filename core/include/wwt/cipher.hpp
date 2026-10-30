#pragma once

#include <string>
#include <string_view>

namespace wwt {

/** Cosmetic Caesar shift. Preserves case and non-letters. Not a security control. */
std::string caesar(std::string_view text, int shift);

}

#ifdef __cplusplus
extern "C" {
#endif

/** Writes NUL-terminated cipher text into out (out_len bytes). Returns bytes written excluding NUL. */
int wwt_caesar(const char* text, int shift, char* out, int out_len);

#ifdef __cplusplus
}
#endif
