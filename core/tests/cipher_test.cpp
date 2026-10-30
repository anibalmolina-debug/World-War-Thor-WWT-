#include "wwt/cipher.hpp"
#include "wwt/version.hpp"

#include <cstdio>
#include <cstdlib>
#include <string>

static int fails = 0;

static void expect(bool ok, const char* msg) {
  if (!ok) {
    std::fprintf(stderr, "FAIL: %s\n", msg);
    ++fails;
  }
}

int main() {
  expect(std::string(wwt::kCoreVersion) == "0.2.0", "version");
  expect(wwt::caesar("Attack at dawn!", 4) == "Exxego ex hear!", "shift 4");
  expect(wwt::caesar("Exxego ex hear!", -4) == "Attack at dawn!", "unshift");
  expect(wwt::caesar("Ávila 12", 4) == "Ávila 12", "non-ascii and digits preserved");
  return fails ? EXIT_FAILURE : EXIT_SUCCESS;
}
